import Home from './pages/Home'
import Profile from './pages/Profile'
import Publish from './pages/Publish'

export const routes = [
  { path: '/', element: Home },
  { path: '/profile', element: Profile },
  { path: '/publish', element: Publish },
] as const