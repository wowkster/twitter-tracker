import NextAuth from 'next-auth'
import GithubProvider from "next-auth/providers/github"
import DiscordProvider from 'next-auth/providers/discord'
import { NextApiRequest, NextApiResponse } from 'next'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../lib/mongodb"

const { GITHUB_ID, GITHUB_SECRET, DISCORD_ID, DISCORD_SECRET } = process.env

const options = {
    providers: [
        GithubProvider({
            clientId: GITHUB_ID as string,
            clientSecret: GITHUB_SECRET as string
        }),
        DiscordProvider({
            clientId: DISCORD_ID as string,
            clientSecret: DISCORD_SECRET as string
        })
    ],
    secret: process.env.SECRET,
    pages: {
        signIn: '/login',
        newUser: '/'
    },
    adapter: MongoDBAdapter(clientPromise),
}

export default (req: NextApiRequest, res: NextApiResponse<any>) => NextAuth(req, res, options)