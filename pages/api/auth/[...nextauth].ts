import NextAuth from 'next-auth'
import GithubProvider from "next-auth/providers/github"
import DiscordProvider from 'next-auth/providers/discord'
import { NextApiRequest, NextApiResponse } from 'next'
import { MongoDBAdapter } from "@next-auth/mongodb-adapter"
import clientPromise from "../../../lib/mongodb"

const { GITHUB_ID, GITHUB_SECRET, DISCORD_ID, DISCORD_SECRET, MONGO_URI, NEXTAUTH_URL } = process.env

const options = {
    providers: [
        GithubProvider({
            clientId: GITHUB_ID!,
            clientSecret: GITHUB_SECRET!
        }),
        DiscordProvider({
            clientId: DISCORD_ID!,
            clientSecret: DISCORD_SECRET!
        })
    ],
    secret: process.env.SECRET,
    pages: {
        signIn: '/login',
        newUser: '/',

    },
    database: MONGO_URI,
    site: NEXTAUTH_URL,
}

export default (req: NextApiRequest, res: NextApiResponse<any>) => NextAuth(req, res, options)