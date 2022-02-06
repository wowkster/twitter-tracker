import { GetServerSidePropsContext } from 'next'
import { getSession, GetSessionParams, useSession } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC } from 'react'
import Graph from '../../components/Graph'
import Layout from '../../components/Layout'
import clientPromise from '../../lib/mongodb'
import { TwitterAccount } from '../../types/twitter'

const AccountDataPage: FC<{
    twitterUser: TwitterAccount
}> = ({ twitterUser }) => {
    const { data: session, status } = useSession()
    const loading = status === 'loading'

    // When rendering client side don't display anything until loading is complete
    if (typeof window !== 'undefined' && loading) return null
    if (!session) return <div>Invalid Session</div>

    return (
        <Layout session={session} title={'@' + twitterUser.username} selectedMenu={'home'}>
            Username: {twitterUser.username}<br/>
            Followers: {twitterUser.followers.current}<br/>
            Following: {twitterUser.following.current}

            <Graph data={twitterUser.followers.history}/>
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

    const client = await clientPromise
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
