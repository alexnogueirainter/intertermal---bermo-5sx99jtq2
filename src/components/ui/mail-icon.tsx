import React from 'react'
import { Mail, LucideProps } from 'lucide-react'

export interface MailIconProps extends LucideProps {
  className?: string
}

/**
 * Componente MailIcon padronizado para uso em toda a aplicação
 * Mantém consistência visual com o kit shadcn/ui e lucide-react
 */
export const MailIcon: React.FC<MailIconProps> = ({ className, ...props }) => {
  return <Mail className={className} {...props} />
}

export { Mail }
export default MailIcon
