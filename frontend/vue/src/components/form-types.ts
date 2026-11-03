export type FormFieldType =
  | 'text'
  | 'password'
  | 'textarea'
  | 'select'
  | 'group'
  | 'roles'
  | 'permissions'
  | 'permission'
  | 'permissionType'

export type FormField = {
  key: string
  label: string
  type?: FormFieldType
  disabled?: boolean
  options?: { title: string; value: string }[]
  validate?: (value: unknown, values: Record<string, unknown>) => string | null
}
