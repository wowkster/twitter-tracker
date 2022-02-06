import type { NextPage } from 'next'
import Link from 'next/link'
import { getSession, GetSessionParams, useSession } from 'next-auth/react'

import styles from '../styles/Home.module.css'
import Layout from '../components/Layout'
import { FC } from 'react'
import { AiOutlineTwitter } from 'react-icons/ai'
import { TwitterAccount } from '../types/twitter'
import { User } from '../types/user'
import clientPromise from '../lib/mongodb'

const Home: NextPage<{
    twitterAccounts: TwitterAccount[]
}> = ({ twitterAccounts: twitterAccounts }) => {
    const { data: session, status } = useSession()
    const loading = status === 'loading'

    // When rendering client side don't display anything until loading is complete
    if (typeof window !== 'undefined' && loading) return null
    if (!session) return <div>Invalid Session</div>

    return (
        <Layout session={session} title={'Dashboard'} selectedMenu={'home'}>
            <div className={styles.twitter_users}>
                {twitterAccounts.map((user, i) => (
                    <TwitterUser key={i} user={user} />
                ))}
            </div>
            {twitterAccounts.length === 0 && (
                <div>
                    You dont have any accounts added yet! Add some in the{' '}
                    <Link href={'/manage_accounts'} passHref>
                        <span className={styles.link}>Account Manager</span>
                    </Link>
                    .
                </div>
            )}
        </Layout>
    )
}

const TwitterUser: FC<{
    user: TwitterAccount
}> = ({ user }) => {
    return (
        <div className={styles.twitter_user}>
            <div className={styles.twitter_user_text}>
                <Link href={'/account/@' + user.username} passHref>
                    <h2 className={styles.twitter_user_username}>
                        <AiOutlineTwitter className={styles.twitter_user_icon} size={32} />@{user.username}
                    </h2>
                </Link>
                <p>Followers: {user.followers.current.toLocaleString("en-US")}</p>
                <p>Following: {user.following.current.toLocaleString("en-US")}</p>
            </div>
            <div className={styles.twitter_user_graph}>here there will be a graph woah :o</div>
        </div>
    )
}

export async function getServerSideProps(context: GetSessionParams) {
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
    const accounts = (await (
        await db.collection('twitter_accounts').find({ username: { $in: user.accounts ?? [] } })
    ).toArray()) as unknown as TwitterAccount[]

    for (let a of accounts) {
        delete (a as any)._id
    }

    client.close()
    console.log('Accounts:', accounts)

    return {
        props: {
            session,
            twitterAccounts: accounts,
        },
    }
}

export default Home
