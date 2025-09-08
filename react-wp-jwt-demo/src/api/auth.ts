import { makeClient } from '../lib/http'

const http = makeClient()

export type JwtLoginResponse = {
  token: string
  user_email: string
  user_nicename: string
  user_display_name: string
}

export async function login(username: string, password: string) {
  const res = await http.post('jwt-auth/v1/token', {
    json: { username, password },
  }).json<JwtLoginResponse>()
  return res
}