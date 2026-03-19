import bcrypt from "bcrypt";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import FacebookProvider from "next-auth/providers/facebook";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "@/app/libs/prismadb";

const isProduction = process.env.NODE_ENV === "production";

function getRequiredEnv(name: string) {
    const value = process.env[name]?.trim();

    if (!value) {
        throw new Error(`[auth] Missing required environment variable: ${name}`);
    }

    return value;
}

function getBaseUrl() {
    const configuredUrl = process.env.NEXTAUTH_URL?.trim();

    if (!configuredUrl) {
        if (isProduction) {
            throw new Error(
                "[auth] NEXTAUTH_URL is required in production. Example: https://your-app.vercel.app"
            );
        }

        return "http://localhost:3000";
    }

    let parsedUrl: URL;

    try {
        parsedUrl = new URL(configuredUrl);
    } catch {
        throw new Error(`[auth] NEXTAUTH_URL is invalid: ${configuredUrl}`);
    }

    if (isProduction) {
        const isLocalHost =
            parsedUrl.hostname === "localhost" || parsedUrl.hostname === "127.0.0.1";

        if (parsedUrl.protocol !== "https:" || isLocalHost) {
            throw new Error(
                `[auth] NEXTAUTH_URL must use your public https domain in production. Current value: ${configuredUrl}`
            );
        }
    }

    return configuredUrl.replace(/\/$/, "");
}

const baseUrl = getBaseUrl();
const googleClientId = getRequiredEnv("GOOGLE_CLIENT_ID");
const googleClientSecret = getRequiredEnv("GOOGLE_CLIENT_SECRET");
const nextAuthSecret = getRequiredEnv("NEXTAUTH_SECRET");

if (isProduction) {
    console.info(
        `[auth] Google redirect URI must be added in Google Cloud: ${baseUrl}/api/auth/callback/google`
    );
}

export const authOptions: AuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        FacebookProvider({
            clientId: process.env.FACEBOOK_ID as string,
            clientSecret: process.env.FACEBOOK_SECRET as string,
        }),
        GoogleProvider({
            clientId: googleClientId,
            clientSecret: googleClientSecret,
        }),
        CredentialsProvider({
            name: 'credentials',
            credentials: {
                email: { label: 'email', type: 'text' },
                password: { label: 'password', type: 'password' },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error('có gì đó sai sai');
                }
                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email
                    }
                });
                if (!user || !user?.hashedPassword) {
                    throw new Error('có gì đó sai sai');
                }
                const isCorrectPassword = await bcrypt.compare(
                    credentials.password,
                    user.hashedPassword
                );
                if (!isCorrectPassword) {
                    throw new Error('có gì đó sai sai');
                }
                return user;
            },
        })
    ],
    debug: process.env.NODE_ENV === 'development',
    pages: {
        signIn: "/",
    },
    session: {
        strategy: "jwt",
    },
    callbacks: {
        async jwt({ token, user }) {
            if (user?.id) {
                token.id = user.id;
            }

            return token;
        },
        async session({ session, token }) {
            if (session.user && token.sub) {
                session.user.id = token.sub;
            }

            if (session.user && token.id) {
                session.user.id = token.id as string;
            }

            return session;
        },
    },
    secret: nextAuthSecret,
};
