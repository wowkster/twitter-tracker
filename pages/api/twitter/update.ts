// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { TwitterClient } from 'twitter-api-client';
import { MongoClient } from 'mongodb'
import clientPromise from '../../../lib/mongodb';
import { TwitterAccount, TwitterAccountPartial } from '../../../types/twitter';

export const { MONGO_URI, TWITTER_API_KEY, TWITTER_API_SECRET, TWITTER_ACCESS_TOKEN, TWITTER_ACCESS_TOKEN_SECRET, CRON_SECRET } = process.env

export const twitterClient = new TwitterClient({
    apiKey: TWITTER_API_KEY as string,
    apiSecret: TWITTER_API_SECRET as string,
    accessToken: TWITTER_ACCESS_TOKEN as string,
    accessTokenSecret: TWITTER_ACCESS_TOKEN_SECRET as string,
});


type ResponseData = {
    message: string
    success: boolean
}

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (!req.headers.authorization) return res.status(401).json({
        success: false,
        message: 'Missing Authorization Secret! Only should be called from cron job'
    })

    if (req.headers.authorization !== CRON_SECRET) return res.status(403).json({
        success: false,
        message: 'Invalid Authorization Secret! Only should be called from cron job'
    })

    /* Create API and DB Clients */
    const client = await clientPromise;
    const db = client.db('twitter_tracker')

    
    /* Pull usernames from Database */
    const accounts = await db.collection('twitter_accounts').find({}) as unknown as TwitterAccount[]

    // Get Twitter stats of all users
    const requests = accounts.map(a => a.username).map(async (username) => {
        const [twitterAccount] = await twitterClient.accountsAndUsers.usersSearch({ q: username });

        return {
            username: username,
            followers: twitterAccount?.followers_count,
            following: twitterAccount?.friends_count,
            avatar: twitterAccount?.profile_image_url_https
        }
    })

    // Await Promises and remove any that errored
    const tAccounts = (await Promise.all(requests)).filter(u => {
        if (u.followers && u.following) return true

        console.error(`[ERROR] User ${u.username} was not resolved!`)
    }) as TwitterAccountPartial[]

    // Remove Duplicates
    const twitterAccounts = [...new Set(tAccounts)]

    /* Update Database */
    twitterAccounts.map(async (user) => {
        await db.collection('twitter_accounts').updateOne({ username: user.username }, {
            $set: {
                'followers.current': user.followers,
                'following.current': user.following,
                'avatar': user.avatar
            },
            $push: {
                'followers.history': {
                    timestamp: new Date().getTime(),
                    value: user.followers
                },
                'following.history': {
                    timestamp: new Date().getTime(),
                    value: user.following
                },
            }
        })
    })

    res.status(200).json({ success: true, message: 'Successfully updated twitter statistics' })
}

