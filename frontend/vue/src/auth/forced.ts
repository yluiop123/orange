import { ref } from 'vue'

/**
 * A 40302 response means the backend requires an initial password change even
 * though the cached user-info did not say so. The layout watches this flag.
 */
export const forcedPasswordChange = ref(false)
