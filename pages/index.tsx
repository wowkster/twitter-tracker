import type { GetServerSidePropsContext, NextPage } from 'next'
import Link from 'next/link'
import { getSession, GetSessionParams, useSession } from 'next-auth/react'

import styles from '../styles/Home.module.css'
import Layout from '../components/Layout'
import { FC } from 'react'
import { AiOutlineTwitter } from 'react-icons/ai'
import { TwitterAccount } from '../types/twitter'
import { User } from '../types/user'
import connectToMongo from '../lib/mongodb'
import Graph from '../components/Graph'
import LineChart from '../components/LineChart'

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
                <p>Followers: {user.followers.current.toLocaleString('en-US')}</p>
                <p>Following: {user.following.current.toLocaleString('en-US')}</p>
            </div>
            <div className={styles.twitter_user_graph}>
                <LineChart
                    dataSets={[
                        {
                            name: 'Followers',
                            data: user.followers.history.filter(
                                e => e.timestamp > new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).getTime()
                            ),
                        },
                    ]}
                    title='Followers (Last 30 Days)'
                    height={150}
                    width={400}
                />
  
            </div>
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

    const client = await connectToMongo()
    const db = client.db('twitter_tracker')

    const user = (await db.collection('users').findOne({ email: session.user?.email })) as unknown as User
    const accounts = (await (
        await db.collection('twitter_accounts').find({ username: { $in: user.accounts ?? [] } })
    ).toArray()) as unknown as TwitterAccount[]

    for (let a of accounts) {
        delete (a as any)._id
    }

    return {
        props: {
            session,
            twitterAccounts: accounts,
        },
    }
}

export default Home
