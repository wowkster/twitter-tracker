import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react';
import clientPromise from '../../../../lib/mongodb';
import { TwitterAccount } from '../../../../types/twitter'
import { User } from '../../../../types/user';
import { twitterClient } from '../update';

type Failure = {
    message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<TwitterAccount | Failure>) {
    const session = await getSession({ req })

    if (req.method !== 'POST') return res.status(403).json({
        message: 'Invalid Method!'
    })

    if (!session) return res.status(403).json({
        message: 'Not signed in!'
    })

    const { username } = req.body
    if (!username) return res.status(400).json({
        message: 'No username provided!'
    })

    /* Create API and DB Clients */
    const client = await clientPromise;
    const db = client.db('twitter_tracker')

    const [twitterAccount] = await twitterClient.accountsAndUsers.usersLookup({ screen_name: username });

    if (!twitterAccount || !twitterAccount.followers_count) return res.status(400).json({
        message: 'Twitter account does not exist!'
    })

    const account: TwitterAccount = {
        username: twitterAccount!.screen_name,
        followers: {
            current: twitterAccount?.followers_count,
            history: []
        },
        following: {
            current: twitterAccount?.friends_count,
            history: []
        },
        avatar: twitterAccount?.profile_image_url_https
    }

    await db.collection('twitter_accounts').updateOne({ username: twitterAccount!.screen_name }, {
        $setOnInsert: account
    }, {
        upsert: true
    })

    const user = (await db.collection('users').findOne({ email: session.user?.email })) as unknown as User

    if (user.accounts?.includes(twitterAccount!.screen_name)) return res.status(400).json({
        message: 'Twitter account already exists on account!'
    })

    await db.collection('users').updateOne({ email: session.user?.email }, {
        $push: {
            accounts: twitterAccount!.screen_name
        }
    })

    delete (account as any)._id

    res.status(200).json(account)
}