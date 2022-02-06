// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import type { NextApiRequest, NextApiResponse } from 'next'
import { TwitterClient } from 'twitter-api-client';
import { MongoClient } from 'mongodb'
import { TwitterAccount, TwitterAccountPartial } from '../../../types/twitter';
import connectToMongo from '../../../lib/mongodb';

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
    // if (!req.headers.authorization) return res.status(401).json({
    //     success: false,
    //     message: 'Missing Authorization Secret! Only should be called from cron job'
    // })

    // if (req.headers.authorization !== CRON_SECRET) {
    //     console.error('Failed access with secret:', req.headers.authorization)

    //     return res.status(403).json({
    //         success: false,
    //         message: 'Invalid Authorization Secret! Only should be called from cron job'
    //     })
    // }

    /* Create API and DB Clients */
    const client = await connectToMongo();
    const db = client.db('twitter_tracker')

    /* Pull usernames from Database */
    const existingAccounts = await (await db.collection('twitter_accounts').find({})).toArray() as unknown as TwitterAccount[]
    1
    console.log('Twitter Accounts:', existingAccounts)

    // Get Twitter stats of all users
    const twitterUsers = await Promise.all(existingAccounts.map(a => a.username).map(async (username) => {
        const [twitterAccount] = await twitterClient.accountsAndUsers.usersLookup({ screen_name: username });

        return twitterAccount
    }))

    console.log('Twitter API Responses:', twitterUsers)

    // Map the twitter api responses to our data type and remove any that errored
    const partials = twitterUsers.map(u => {
        return {
            username: u.screen_name,
            followers: u?.followers_count,
            following: u?.friends_count,
            avatar: u?.profile_image_url_https
        }
    }).filter(u => {
        if (u.followers && u.following) return true

        console.error(`[ERROR] User ${u.username} was not resolved!`)
    }) as TwitterAccountPartial[]

    console.log('Twitter Account Partials:', partials)

    /* Update Database */
    const time = new Date().getTime() // Sync time across all db entries

    await Promise.all(partials.map(async (user) => {
        await db.collection('twitter_accounts').updateOne({ username: user.username }, {
            $set: {
                'followers.current': user.followers,
                'following.current': user.following,
                'avatar': user.avatar
            },
            $push: {
                'followers.history': {
                    timestamp: time,
                    value: user.followers
                },
                'following.history': {
                    timestamp: time,
                    value: user.following
                },
            }
        })
    }))

    console.log('Updated Database and awaited all requests')

    res.status(200).json({ success: true, message: 'Successfully updated twitter statistics' })
}

