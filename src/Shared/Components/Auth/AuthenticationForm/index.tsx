'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

// Contexts
import { useLoading } from '@/Shared/Context/LoadingContext'

// UI Components
import { Button, Form, FormControl, FormField, FormItem, FormMessage, Input } from '@/Shared/UI'

// Icons lock-keyhole
import { LockKeyhole } from 'lucide-react'

// hooks
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

// actions
import { authenticatedUser } from '@/Features/Authentication/Actions'

// translation
import { getTranslation } from '@/Shared/Lib/Translation'

// utils
import { LoginFormData, loginSchema } from '@/Features/Authentication/Schema'

const LoginForm = () => {
  /*********** states **********/
  const [isPending, startTransition] = useTransition()

  /*********** hooks **********/
  const router = useRouter()
  const { loading, setLoading } = useLoading()

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      code: process.env.NODE_ENV === 'development' ? process.env.NEXT_PUBLIC_USER_CODE : ''
    }
  })

  /*********** functions **********/
  const onSubmit = (values: LoginFormData) => {
    setLoading(true)

    startTransition(async () => {
      try {
        const res = await authenticatedUser(values.code)
        if (res.status === 'error') {
          toast.error(res.message)
        } else {
          toast.success(getTranslation('alerts.auth.signInSuccess'))
          router.push('/home')
        }
      } catch (error) {
        toast.error(getTranslation('alerts.auth.signInError'))
        console.error(error)
      } finally {
        setLoading(false)
      }
    })
  }

  /*********** life cycle **********/

  return (
    <>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Email Field */}
          <FormField
            control={form.control}
            name="code"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <div className="relative">
                    <LockKeyhole className="absolute start-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-700 dark:text-neutral-200" />
                    <Input
                      {...field}
                      type="text"
                      placeholder={getTranslation('inputs.code.placeholder')}
                      name="code"
                      className="ps-13 pe-12 h-14 rounded-xl bg-neutral-100 dark:bg-slate-800 border border-neutral-300 dark:border-slate-700 focus:border-primary dark:focus:border-primary focus-visible:border-primary shadow-none! ring-0!"
                      disabled={loading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full rounded-lg h-13 text-sm mt-2"
            disabled={loading || isPending}
            loading={{ onLoading: loading || isPending, loadingText: getTranslation('buttons.SignIn.loadingText') }}
          >
            {getTranslation('buttons.SignIn.text')}
          </Button>
        </form>
      </Form>
    </>
  )
}

export default LoginForm
