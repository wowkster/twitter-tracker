import { GetServerSidePropsContext } from 'next'
import { getSession, GetSessionParams, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC, useState } from 'react'
import Layout from '../components/Layout'
import clientPromise from '../lib/mongodb'
import { TwitterAccount } from '../types/twitter'
import { User } from '../types/user'

import styles from '../styles/AccountManager.module.css'
import Link from 'next/link'
import { AiOutlineTwitter } from 'react-icons/ai'
import { BsFillTrashFill } from 'react-icons/bs'
import { MdError } from 'react-icons/md'

const AccountDataPage: FC<{
    twitterAccounts: TwitterAccount[]
}> = ({ twitterAccounts }) => {
    const [usernameContent, setUsernameContent] = useState('')
    const [twitterAccountList, setTwitterAccountList] = useState(twitterAccounts)
    const [error, setError] = useState(null)

    const { data: session, status } = useSession()
    const loading = status === 'loading'

    // When rendering client side don't display anything until loading is complete
    if (typeof window !== 'undefined' && loading) return null
    if (!session) return <div>Invalid Session</div>

    const handleAdd = async evt => {
        setError(null)
        setUsernameContent('')
        const res = await fetch('/api/twitter/account/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username: usernameContent,
            }),
        })

        const data = (await res.json()) as TwitterAccount | any
        if (!res.ok) return setError(data?.message)

        setTwitterAccountList([...twitterAccountList, data])
    }

    const handleDelete = async username => {
        setError(null)
        const res = await fetch('/api/twitter/account/remove', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                username,
            }),
        })

        const data = (await res.json()) as TwitterAccount | any
        if (!res.ok) return setError(data?.message)

        setTwitterAccountList(twitterAccountList.filter(a => a.username !== username))
    }

    return (
        <Layout session={session} title='Account Manager' selectedMenu={'manage_accounts'}>
            <form onSubmit={evt => evt.preventDefault()} className={styles.button_container}>
                <input
                    type='text'
                    name='username'
                    id='username'
                    className={styles.input}
                    value={usernameContent}
                    onChange={evt => setUsernameContent(evt.target.value)}
                    placeholder='Username e.g. UofSN'
                />
                <input
                    className={styles.add_button}
                    type={'submit'}
                    onClick={handleAdd}
                    disabled={usernameContent === ''}
                    value={'Add'}
                />
            </form>
            {error && (
                <div className={styles.error}>
                    <MdError size={24} /> <div>{error}</div>
                </div>
            )}
            <section>
                {twitterAccountList.map(a => (
                    <TwitterAccount key={a.username} username={a.username} onClick={handleDelete} />
                ))}
                {
                    twitterAccountList.length === 0 && <p className={styles.empty_label}>Nothing to see here yet</p>
                }
            </section>
        </Layout>
    )
}

const TwitterAccount: FC<{
    username: string
    onClick(username: string): void
}> = ({ username, onClick }) => {
    return (
        <div className={styles.twitter_user}>
            <AiOutlineTwitter className={styles.twitter_user_icon} size={32} />
            <Link href={'/account/@' + username} passHref>
                <h3 className={styles.twitter_user_username}>@{username}</h3>
            </Link>
            <BsFillTrashFill className={styles.trash_icon} size={24} onClick={() => onClick(username)} />
        </div>
    )
}

export async function getServerSideProps(context: GetServerSidePropsContext) {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        }
    }

    const client = await clientPromise
    const db = client.db('twitter_tracker')

    const user = (await db.collection('users').findOne({ email: session.user?.email })) as unknown as User

    console.log('User:', user)

    const accounts = (await (
        await db.collection('twitter_accounts').find({ username: { $in: user.accounts ?? [] } })
    ).toArray()) as unknown as TwitterAccount[]

    for (let a of accounts) {
        delete (a as any)._id
    }

    console.log('Accounts:', accounts)
    console.log('Accounts Raw:', user.accounts)
    return {
        props: {
            session,
            twitterAccounts: accounts ?? [],
        },
    }
}

export default AccountDataPage
