import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/Shared/Lib/Utils'

interface LoadingProps {
  onLoading: boolean
  loadingText?: string
}

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive  active:scale-[.95]",
  {
    variants: {
      variant: {
        default: 'cursor-pointer bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 dark:text-white',
        destructive:
          'cursor-pointer bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/60',
        outline:
          'cursor-pointer border border-primary text-primary bg-transparent shadow-xs hover:bg-primary hover:text-white dark:bg-transparent dark:border-primary dark:hover:bg-input/50',
        secondary: 'cursor-pointer bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
        ghost: 'cursor-pointer hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        link: 'cursor-pointer text-primary underline-offset-4 hover:underline'
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9'
      },
      fullWidth: {
        true: 'w-full',
        false: ''
      }
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false
    }
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading,
  children,
  fullWidth,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean | LoadingProps
  }) {
  const Comp = asChild ? Slot : 'button'

  const isLoading = typeof loading === 'boolean' ? loading : loading?.onLoading
  const loadingText = typeof loading === 'object' && loading.loadingText ? loading.loadingText : 'enviando'

  return (
    <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className, fullWidth }))} {...props}>
      {isLoading ? (
        <>
          <Loader2 className="animate-spin h-4.5 w-4.5 mr-2" />
          {loadingText}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
