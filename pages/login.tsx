import { GetServerSidePropsContext, InferGetServerSidePropsType } from 'next'
import { Provider } from 'next-auth/providers'
import { getProviders, getSession, GetSessionParams, signIn } from 'next-auth/react'
import { useRouter } from 'next/router'
import { FC } from 'react'
import { AiFillGithub } from 'react-icons/ai'
import { FaDiscord } from 'react-icons/fa'
import { MdError } from 'react-icons/md'
import { BasicLayout } from '../components/Layout'

import styles from '../styles/Login.module.css'
import { combine } from '../utils/styles'

const LoginPage: FC<{
    providers: Provider[]
}> = ({ providers }) => {
    const router = useRouter()

    console.log(router.query)
    const error = translateErrorCode(router.query.error)

    return (
        <BasicLayout title={'Login'}>
            <div className={styles.container}>
                <div className={styles.login_frame}>
                    <h1 className={styles.login_title}>Log in</h1>
                    <p>
                        To use Snoopy, please sign in with one of the providers below. If you do not already have an
                        account a new one will be created for you.
                    </p>
                    {error && (
                        <div className={styles.error}>
                            <MdError size={32} /> <div>{error}</div>
                        </div>
                    )}
                    <div className={styles.button_list}>
                        {Object.values(providers).map(provider => (
                            <button
                                key={provider.name}
                                className={combine(
                                    styles.provider_button,
                                    provider.id === 'github' && styles.github_button,
                                    provider.id === 'discord' && styles.discord_button
                                )}
                                onClick={() => signIn(provider.id)}>
                                {provider.id === 'github' && <AiFillGithub size={28} />}
                                {provider.id === 'discord' && <FaDiscord size={28} />}
                                Sign in with {provider.name}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </BasicLayout>
    )
}

export async function getServerSideProps(context: GetSessionParams) {
    const session = await getSession(context)

    if (session) {
        return {
            redirect: {
                destination: '/',
                permanent: false,
            },
        }
    }

    const providers = await getProviders()
    console.log(providers)
    return {
        props: { providers },
    }
}

export default LoginPage

function translateErrorCode(error: string | string[] | undefined): string | null {
    if (Array.isArray(error)) error = error[0]

    switch (error) {
        case 'OAuthSignin':
            return 'An error when constructing the OAuth authorization URL! Please Try Again.'
        case 'OAuthCallback':
            return 'An error when handling the response from the OAuth provider! Please Try Again.'
        case 'Callback':
            return 'An error when handling OAuth callback! Please Try Again.'
        case 'OAuthCreateAccount':
            return 'Could not create OAuth provider user in the database! Please Try Again.'
        case 'OAuthAccountNotLinked':
            return 'An account with that email exists, but not with the OAuth provider you selected. Please try another provider.'
        case 'Default':
            return 'An error while trying to sign you in! Please Try Again.'
        default:
            return null
    }
}
