import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')
const cert = `-----BEGIN CERTIFICATE-----
MIIDATCCAemgAwIBAgIJQvXofEfP4zrIMA0GCSqGSIb3DQEBCwUAMB4xHDAaBgNV
BAMTE3lic25lay5ldS5hdXRoMC5jb20wHhcNMjAwOTA5MTM0NjIwWhcNMzQwNTE5
MTM0NjIwWjAeMRwwGgYDVQQDExN5YnNuZWsuZXUuYXV0aDAuY29tMIIBIjANBgkq
hkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAvyxHEzr3a8WTvsKgTpoihGsHbvyzSETD
/Ma8/O2j+JzxURGKjps+Q3tDHAt26mbWcqKsi3CyjzV/yLRK7OP/TXs56Fw5fOzI
iRxJtrjSYdZN6rO+71acwWQhjPsaccrIOcX8DqSNsDelSvtCBf+GTZPi7wzy8+bB
Z0QLMq+z+eSINAR8pUlzGmO3rOjzzzzvoe+dSV/GoYeDMVu39OZ5Zu5YiRVdWdII
JBnCQQlnjj1q+S/IFuXpsnVzckGKxyX2Qbvkpp5LAzkI5KxSxlM7lDmgTT89q4NW
qptCKgKn87ItJrkL3zHfQTkXWrDxykt5bRV2qNoNtusn/Mlq0FvXYQIDAQABo0Iw
QDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTpPBmvVtJq0CyfboUUm+7dWlPG
SjAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAJJ8ysb31JfhbrcR
9Y29ZLjggJTkVJ1mQHODivPT2wF1NaFzhzJhwzef4xQcq0/KszgFvjbmid5Q1Qj+
kmliMWyEfAAQw9yIsyA3rfJICcWttAnD9k301jBIU7YIXN0NeZIpmRQsJXeFPqGf
LykNeHvz+GV03EIruQe/ONk1LbChvRSH9smA6Gr/LhvyA1hQzBe3JVXDKCxNkMvy
l9VswhIH+goaYW3Mrb+jOa375Gvhqz8dToQzrD08zF2p2vPRX0J8ZdqsCeyUsDUQ
3wTmZ6JHdVnqTb6bOd+IaU6H8VN7OcZ/V57wVarQlx1SDhk9n2Vc51scNuohfScu
lpg7/zo=
-----END CERTIFICATE-----`

// TODOx: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set

//does not seem to be triavial and pretty sure its optional so...
//const jwksUrl = 'https://ybsnek.eu.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)

  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  console.log("jwt", jwt)
  // TODO: Implement token verification
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  return verify(
      token,
      cert,
      { algorithms: ['RS256'] }
  ) as JwtPayload
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
