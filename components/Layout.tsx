import React, { FC } from 'react'
import Head from 'next/head'
import Link from 'next/link'
import Image from 'next/image'
import { HiHome, HiLogout } from 'react-icons/hi'
import { FaCompass, FaUsersCog } from 'react-icons/fa'
import styles from '../styles/Layout.module.css'
import { combine } from '../utils/styles'
import { Session } from 'next-auth'
import { signOut } from 'next-auth/react'

const Layout: FC<{
    session: Session
    title: string
    selectedMenu: 'home' | 'manage_accounts'
}> = ({ session, title, selectedMenu, children }) => {
    return (
        <div className={styles.container}>
            <Head>
                <title>{title} - Snoopy Social Media Tracker</title>
                <meta name='description' content='Track the statistics of multiple twitter accounts over time' />
                <link rel='icon' href='/favicon.ico' />
            </Head>

            <nav className={styles.sidebar}>
                <div className={styles.logo}>
                    <FaCompass size={32} />
                    <span>Snoopy</span>
                </div>

                <ul className={styles.sidebar_menu}>
                    <li>
                        <Link href={'/'} passHref>
                            <div
                                className={combine(
                                    styles.sidebar_menu_item,
                                    selectedMenu === 'home' && styles.side_menu_active
                                )}>
                                <HiHome size={24} />
                                <span>Dashboard</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <Link href={'/manage_accounts'} passHref>
                            <div
                                className={combine(
                                    styles.sidebar_menu_item,
                                    selectedMenu === 'manage_accounts' && styles.side_menu_active
                                )}>
                                <FaUsersCog size={24} />
                                <span>Manage Accounts</span>
                            </div>
                        </Link>
                    </li>
                    <li>
                        <div className={styles.sidebar_menu_item} onClick={() => signOut()}>
                            <HiLogout size={24} />
                            <span>Log out</span>
                        </div>
                    </li>
                </ul>
            </nav>

            <section className={combine(styles.content, styles.left_pad)}>
                <header className={styles.header}>
                    <h1>{title}</h1>
                    <div className={styles.profile}>
                        <span className={styles.username}>Hi, {session.user?.name}</span>
                        <div className={styles.profile_pic}>
                            <Image alt='' src={session.user?.image ?? ''} width={48} height={48} />
                        </div>
                    </div>
                </header>

                <main className={styles.main}>{children}</main>
            </section>
            <footer className={combine(styles.footer, styles.left_pad)}>
                &copy; 2022 Wowkster. All rights reserved
            </footer>
        </div>
    )
}

export const BasicLayout: FC<{
    title: string
}> = ({ title, children }) => {
    return (
        <div className={styles.container}>
            <Head>
                <title>{title} - Snoopy Social Media Tracker</title>
                <meta name='description' content='Track the statistics of multiple twitter accounts over time' />
                <link rel='icon' href='/favicon.ico' />
            </Head>

            <main className={styles.content}>{children}</main>
            <footer className={styles.footer}>&copy; 2022 Wowkster. All rights reserved</footer>
        </div>
    )
}

export default Layout
