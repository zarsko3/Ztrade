# Blueprint: Task 8.3.1 - Implement User Authentication System

## 📋 Blueprint Overview

**Goal**: Add secure user authentication to the trading app to protect user data, enable multi-user support, and provide personalized experiences.

**Expected Outcome**: A complete authentication system with user registration, login, logout, and protected routes that ensures each user can only access their own trading data.

**Priority**: High (Required for production)
**Effort**: High (8+ hours)
**Dependencies**: Task 8.2.1 (Supabase Database) completed

## 🎯 Success Criteria

- [ ] User registration and login functionality
- [ ] Protected routes and API endpoints
- [ ] User data isolation (each user sees only their data)
- [ ] Secure session management
- [ ] Password reset functionality
- [ ] User profile management
- [ ] Authentication UI components
- [ ] Database schema updated for user support

## 📋 Step-by-Step Actions

### 1. Authentication Setup
1. **Install authentication dependencies**
   ```bash
   npm install next-auth @next-auth/prisma-adapter
   npm install bcryptjs @types/bcryptjs
   ```

2. **Configure NextAuth.js**
   ```bash
   # Create NextAuth configuration
   mkdir -p src/app/api/auth/[...nextauth]
   ```

3. **Set up environment variables**
   ```env
   # Add to .env.local
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   GOOGLE_CLIENT_ID="your-google-client-id"
   GOOGLE_CLIENT_SECRET="your-google-client-secret"
   ```

### 2. Database Schema Updates
1. **Update Prisma schema for users**
   ```prisma
   // Add to schema.prisma
   model User {
     id            String    @id @default(cuid())
     email         String    @unique
     name          String?
     password      String?
     image         String?
     emailVerified DateTime?
     createdAt     DateTime  @default(now())
     updatedAt     DateTime  @updatedAt
     
     // Relationships
     trades        Trade[]
     performances  Performance[]
     
     @@map("users")
   }
   
   model Account {
     id                String  @id @default(cuid())
     userId            String
     type              String
     provider          String
     providerAccountId String
     refresh_token     String? @db.Text
     access_token      String? @db.Text
     expires_at        Int?
     token_type        String?
     scope             String?
     id_token          String? @db.Text
     session_state     String?
     
     user User @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@unique([provider, providerAccountId])
     @@map("accounts")
   }
   
   model Session {
     id           String   @id @default(cuid())
     sessionToken String   @unique
     userId       String
     expires      DateTime
     user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@map("sessions")
   }
   
   model VerificationToken {
     identifier String
     token      String   @unique
     expires    DateTime
     
     @@unique([identifier, token])
     @@map("verification_tokens")
   }
   ```

2. **Update existing models for user relationships**
   ```prisma
   // Update Trade model
   model Trade {
     // ... existing fields ...
     userId String
     user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@index([userId])
   }
   
   // Update Performance model
   model Performance {
     // ... existing fields ...
     userId String
     user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
     
     @@index([userId])
   }
   ```

### 3. NextAuth Configuration
1. **Create NextAuth API route**
   ```typescript
   // src/app/api/auth/[...nextauth]/route.ts
   import NextAuth from "next-auth"
   import { PrismaAdapter } from "@next-auth/prisma-adapter"
   import GoogleProvider from "next-auth/providers/google"
   import CredentialsProvider from "next-auth/providers/credentials"
   import { prisma } from "@/lib/prisma"
   import bcrypt from "bcryptjs"
   
   const handler = NextAuth({
     adapter: PrismaAdapter(prisma),
     providers: [
       GoogleProvider({
         clientId: process.env.GOOGLE_CLIENT_ID!,
         clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       }),
       CredentialsProvider({
         name: "credentials",
         credentials: {
           email: { label: "Email", type: "email" },
           password: { label: "Password", type: "password" }
         },
         async authorize(credentials) {
           if (!credentials?.email || !credentials?.password) {
             return null
           }
           
           const user = await prisma.user.findUnique({
             where: { email: credentials.email }
           })
           
           if (!user || !user.password) {
             return null
           }
           
           const isPasswordValid = await bcrypt.compare(
             credentials.password,
             user.password
           )
           
           if (!isPasswordValid) {
             return null
           }
           
           return user
         }
       })
     ],
     session: {
       strategy: "jwt"
     },
     pages: {
       signIn: "/auth/signin",
       signUp: "/auth/signup",
     },
     callbacks: {
       async session({ session, token }) {
         if (token.sub && session.user) {
           session.user.id = token.sub
         }
         return session
       },
       async jwt({ token, user }) {
         if (user) {
           token.sub = user.id
         }
         return token
       }
     }
   })
   
   export { handler as GET, handler as POST }
   ```

### 4. Authentication UI Components
1. **Create sign-in page**
   ```typescript
   // src/app/auth/signin/page.tsx
   "use client"
   
   import { signIn, getSession } from "next-auth/react"
   import { useState } from "react"
   import { useRouter } from "next/navigation"
   
   export default function SignIn() {
     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [loading, setLoading] = useState(false)
     const router = useRouter()
   
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault()
       setLoading(true)
   
       const result = await signIn("credentials", {
         email,
         password,
         redirect: false,
       })
   
       if (result?.ok) {
         router.push("/")
       } else {
         // Handle error
         setLoading(false)
       }
     }
   
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="max-w-md w-full space-y-8">
           <div>
             <h2 className="text-center text-3xl font-bold">Sign in to Trade</h2>
           </div>
           <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             <div>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email address"
                 required
                 className="w-full px-3 py-2 border rounded-md"
               />
             </div>
             <div>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Password"
                 required
                 className="w-full px-3 py-2 border rounded-md"
               />
             </div>
             <button
               type="submit"
               disabled={loading}
               className="w-full py-2 px-4 bg-blue-600 text-white rounded-md"
             >
               {loading ? "Signing in..." : "Sign in"}
             </button>
           </form>
           <button
             onClick={() => signIn("google")}
             className="w-full py-2 px-4 border border-gray-300 rounded-md"
           >
             Sign in with Google
           </button>
         </div>
       </div>
     )
   }
   ```

2. **Create sign-up page**
   ```typescript
   // src/app/auth/signup/page.tsx
   "use client"
   
   import { useState } from "react"
   import { useRouter } from "next/navigation"
   import bcrypt from "bcryptjs"
   
   export default function SignUp() {
     const [name, setName] = useState("")
     const [email, setEmail] = useState("")
     const [password, setPassword] = useState("")
     const [loading, setLoading] = useState(false)
     const router = useRouter()
   
     const handleSubmit = async (e: React.FormEvent) => {
       e.preventDefault()
       setLoading(true)
   
       const hashedPassword = await bcrypt.hash(password, 12)
   
       const response = await fetch("/api/auth/signup", {
         method: "POST",
         headers: { "Content-Type": "application/json" },
         body: JSON.stringify({
           name,
           email,
           password: hashedPassword,
         }),
       })
   
       if (response.ok) {
         router.push("/auth/signin")
       } else {
         // Handle error
         setLoading(false)
       }
     }
   
     return (
       <div className="min-h-screen flex items-center justify-center">
         <div className="max-w-md w-full space-y-8">
           <div>
             <h2 className="text-center text-3xl font-bold">Create Account</h2>
           </div>
           <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
             <div>
               <input
                 type="text"
                 value={name}
                 onChange={(e) => setName(e.target.value)}
                 placeholder="Full name"
                 required
                 className="w-full px-3 py-2 border rounded-md"
               />
             </div>
             <div>
               <input
                 type="email"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
                 placeholder="Email address"
                 required
                 className="w-full px-3 py-2 border rounded-md"
               />
             </div>
             <div>
               <input
                 type="password"
                 value={password}
                 onChange={(e) => setPassword(e.target.value)}
                 placeholder="Password"
                 required
                 className="w-full px-3 py-2 border rounded-md"
               />
             </div>
             <button
               type="submit"
               disabled={loading}
               className="w-full py-2 px-4 bg-blue-600 text-white rounded-md"
             >
               {loading ? "Creating account..." : "Create account"}
             </button>
           </form>
         </div>
       </div>
     )
   }
   ```

### 5. API Route Protection
1. **Create authentication middleware**
   ```typescript
   // src/lib/auth.ts
   import { getServerSession } from "next-auth/next"
   import { authOptions } from "@/app/api/auth/[...nextauth]/route"
   
   export async function getSession() {
     return await getServerSession(authOptions)
   }
   
   export async function getCurrentUser() {
     const session = await getSession()
     return session?.user
   }
   ```

2. **Update API routes to require authentication**
   ```typescript
   // Example: Update /api/trades route
   import { getCurrentUser } from "@/lib/auth"
   
   export async function GET() {
     const user = await getCurrentUser()
     
     if (!user) {
       return new Response("Unauthorized", { status: 401 })
     }
   
     const trades = await prisma.trade.findMany({
       where: { userId: user.id },
       // ... rest of query
     })
   
     return Response.json(trades)
   }
   ```

### 6. UI Integration
1. **Add authentication state to layout**
   ```typescript
   // src/app/layout.tsx
   import { SessionProvider } from "next-auth/react"
   
   export default function RootLayout({ children }) {
     return (
       <html>
         <body>
           <SessionProvider>
             {children}
           </SessionProvider>
         </body>
       </html>
     )
   }
   ```

2. **Update navigation with auth state**
   ```typescript
   // src/components/layouts/Sidebar.tsx
   import { useSession, signOut } from "next-auth/react"
   
   export function Sidebar() {
     const { data: session } = useSession()
   
     return (
       <div>
         {/* ... existing sidebar content ... */}
         {session ? (
           <div>
             <p>Welcome, {session.user.name}</p>
             <button onClick={() => signOut()}>Sign out</button>
           </div>
         ) : (
           <Link href="/auth/signin">Sign in</Link>
         )}
       </div>
     )
   }
   ```

### 7. Database Migration
1. **Create and run migration**
   ```bash
   npx prisma migrate dev --name add-user-authentication
   ```

2. **Update existing data (if any)**
   ```sql
   -- Create default user for existing data
   INSERT INTO users (id, email, name, createdAt, updatedAt)
   VALUES ('default-user', 'default@example.com', 'Default User', NOW(), NOW());
   
   -- Update existing trades to belong to default user
   UPDATE trades SET userId = 'default-user' WHERE userId IS NULL;
   ```

## ⚠️ Potential Issues & Solutions

### Issue: Session Management
**Solution**: Ensure proper JWT configuration and session handling

### Issue: Database Migration Conflicts
**Solution**: Test migration on copy of production data first

### Issue: OAuth Provider Setup
**Solution**: Follow provider-specific setup guides (Google, GitHub, etc.)

### Issue: Password Security
**Solution**: Use bcrypt for password hashing and enforce strong passwords

## 📊 Success Metrics

- [ ] Users can register and login successfully
- [ ] Protected routes redirect to login
- [ ] User data is properly isolated
- [ ] Sessions persist across browser restarts
- [ ] Password reset functionality works
- [ ] OAuth providers configured and working

## 🔄 Next Steps After Completion

1. **Add password reset functionality**
2. **Implement email verification**
3. **Add user profile management**
4. **Set up user roles and permissions**

## 📚 Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Prisma Adapter Guide](https://next-auth.js.org/adapters/prisma)
- [Supabase Auth Integration](https://supabase.com/docs/guides/auth)
- [Authentication Best Practices](https://owasp.org/www-project-cheat-sheets/) 