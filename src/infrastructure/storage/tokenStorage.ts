// Control temporal para evitar redirecciones del interceptor durante signOut
let isLoggingOut = false

export const markLoggingOut = (value: boolean): void => {
  isLoggingOut = value
}

export const getIsLoggingOut = (): boolean => isLoggingOut
