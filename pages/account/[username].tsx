import { GetServerSidePropsContext } from 'next'
import { getSession, GetSessionParams, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC } from 'react'
import LineChart from '../../components/LineChart'
import Graph from '../../components/Graph'
import Layout from '../../components/Layout'
import connectToMongo from '../../lib/mongodb'
import { TwitterAccount } from '../../types/twitter'

const AccountDataPage: FC<{
    twitterUser: TwitterAccount
}> = ({ twitterUser }) => {
    const { data: session, status } = useSession()
    const loading = status === 'loading'

    // When rendering client side don't display anything until loading is complete
    if (typeof window !== 'undefined' && loading) return null
    if (!session) return <div>Invalid   Session</div>

    return (
        <Layout session={session} title={'@' + twitterUser.username} selectedMenu={'manage_accounts'}>
           <img src={twitterUser.avatar.replace('_normal', '')} width={200} alt={`${twitterUser.username}'s Profile Picture`} />

           <h3>Current Data</h3>
           <p>
               Followers: {twitterUser.followers.current.toLocaleString()}<br/>
               Following: {twitterUser.following.current.toLocaleString()}
           </p>

            <LineChart dataSets={[
                {
                    name: 'Followers',
                    data: twitterUser.followers.history
                },
                {
                    name: 'Following',
                    data: twitterUser.following.history
                }
            ]} title='Followers/Following (All Time)' />
        </Layout>
    )
}

type CtxData = {
    params: {
        username: string
    }
}

export async function getServerSideProps(context: GetServerSidePropsContext & CtxData) {
    const session = await getSession(context)

    if (!session) {
        return {
            redirect: {
                destination: '/login',
                permanent: false,
            },
        }
    }

    let { username } = context.params

    if (!username.startsWith('@'))
        return {
            notFound: true,
        }

    username = username.substring(1)

    const client = await connectToMongo()
    const db = client.db('twitter_tracker')

    const account = (await db.collection('twitter_accounts').findOne({ username })) as unknown as TwitterAccount

    delete (account as any)._id

    if (!account) {
        return {
            notFound: true,
        }
    }

    return {
        props: {
            session,
            twitterUser: account,
        },
    }
}

export default AccountDataPage
