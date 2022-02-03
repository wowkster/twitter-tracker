// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { TwitterClient } from 'twitter-api-client';
import { MongoClient } from 'mongodb'

const { MONGO_URI, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, CRON_SECRET } = process.env


type ResponseData = {
    message: string
    success: boolean
}

interface UserPartial {
    username: string
    followers: number
    following: number
}

interface User {
    username: string
    followers: History
    following: History
}

interface History {
    current: number
    history:
    {
        timestamp: string
        value: number
    }[]

}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (!req.headers.authorization) return res.status(403).json({
        success: false,
        message: 'Missing Authorization Secret! Only should be called from cron job'
    })

    if (req.headers.authorization !== CRON_SECRET) return res.status(403).json({
        success: false,
        message: 'Invalid Authorization Secret! Only should be called from cron job'
    })

    /* Create API and DB Clients */
    const client = new MongoClient(MONGO_URI as string);
    await client.connect();
    const db = client.db('twitter_tracker')

    const twitterClient = new TwitterClient({
        apiKey: TWITTER_API_KEY as string,
        apiSecret: TWITTER_API_SECRET as string,
        accessToken: TWITTER_ACCESS_TOKEN as string,
        accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET as string,
    });

    /* Pull usernames from Database */
    const users = await db.collection('twitter_users').find({}) as unknown as User[]

    // Get Twitter stats of all users
    const reqs = users.map(u => u.username).map(async (username) => {
        const [twitterUser] = await twitterClient.accountsAndUsers.usersSearch({ q: username });

        return {
            username: username,
            followers: twitterUser?.followers_count,
            following: twitterUser?.friends_count
        }
    })

    // Await Promises and remove any that errored
    const tUsers = (await Promise.all(reqs)).filter(u => {
        if (u.followers && u.following) return true

        console.error(`[ERROR] User ${u.username} was not resolved!`)
    }) as UserPartial[]

    // Remove Duplicates
    const twtitterUsers =  [...new Set(users)]

    /* Update Database */
    twtitterUsers.map(async (user) => {
        await db.collection('twitter_users').updateOne({ username: user.username }, {
            $set: {
                'followers.current': user.followers,
                'following.current': user.following,
            },
            $push: {
                'followers.history': {
                    timestamp: new Date().toJSON(),
                    value: user.followers
                },
                'following.history': {
                    timestamp: new Date().toJSON(),
                    value: user.following
                },
            }
        })
    })

    res.status(200).json({ success: true, message: 'Successfully updated twitter statistics' })
}

