export interface TwitterAccountPartial {
    username: string
    followers: number
    following: number
    avatar: string
}

export interface TwitterAccount {
    username: string
    avatar: string
    followers: History
    following: History
}

export interface History {
    current: number
    history:
    {
        timestamp: number
        value: number
    }[]

}