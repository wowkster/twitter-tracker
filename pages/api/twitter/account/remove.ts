import type { NextApiRequest, NextApiResponse } from 'next'
import { getSession } from 'next-auth/react';
import clientPromise from '../../../../lib/mongodb';
import { twitterClient } from '../update';

type Data = {
    message: string
}

export default async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
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

    await db.collection('users').updateOne({ email: session.user?.email }, {
        $pull: {
            accounts: username
        }
    })

    res.status(200).json({
        message: 'Successfully updated user'
    })
}