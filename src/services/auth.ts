import * as AuthSession from 'expo-auth-session';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import * as WebBrowser from 'expo-web-browser';
import { User, AuthProvider } from '../types';
import { OAUTH_CONFIG } from '../config/constants';
import { v4 as uuidv4 } from 'uuid';

// Enable web browser redirect handling
WebBrowser.maybeCompleteAuthSession();

// Google OAuth discovery document
const googleDiscovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

// Microsoft OAuth discovery document
const microsoftDiscovery = {
  authorizationEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/authorize`,
  tokenEndpoint: `https://login.microsoftonline.com/${OAUTH_CONFIG.microsoft.tenantId}/oauth2/v2.0/token`,
};

export interface AuthResult {
  user: User;
  accessToken: string;
  refreshToken?: string;
}

class AuthServiceClass {
  // Google Sign In
  async signInWithGoogle(): Promise<AuthResult> {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'kcapp',
      path: 'oauth/google',
    });

    const request = new AuthSession.AuthRequest({
      clientId: OAUTH_CONFIG.google.clientId,
      scopes: OAUTH_CONFIG.google.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    const result = await request.promptAsync(googleDiscovery);

    if (result.type !== 'success' || !result.params.code) {
      throw new Error('Google sign in was cancelled or failed');
    }

    // Exchange code for tokens
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: OAUTH_CONFIG.google.clientId,
        code: result.params.code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier || '',
        },
      },
      googleDiscovery
    );

    // Get user info from Google
    const userInfoResponse = await fetch(
      'https://www.googleapis.com/oauth2/v2/userinfo',
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    const user: User = {
      id: userInfo.id,
      email: userInfo.email,
      displayName: userInfo.name,
      photoUrl: userInfo.picture,
      provider: 'google',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      user,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
    };
  }

  // Microsoft Sign In
  async signInWithMicrosoft(): Promise<AuthResult> {
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'kcapp',
      path: 'oauth/microsoft',
    });

    const request = new AuthSession.AuthRequest({
      clientId: OAUTH_CONFIG.microsoft.clientId,
      scopes: OAUTH_CONFIG.microsoft.scopes,
      redirectUri,
      responseType: AuthSession.ResponseType.Code,
      usePKCE: true,
    });

    const result = await request.promptAsync(microsoftDiscovery);

    if (result.type !== 'success' || !result.params.code) {
      throw new Error('Microsoft sign in was cancelled or failed');
    }

    // Exchange code for tokens
    const tokenResponse = await AuthSession.exchangeCodeAsync(
      {
        clientId: OAUTH_CONFIG.microsoft.clientId,
        code: result.params.code,
        redirectUri,
        extraParams: {
          code_verifier: request.codeVerifier || '',
        },
      },
      microsoftDiscovery
    );

    // Get user info from Microsoft Graph
    const userInfoResponse = await fetch(
      'https://graph.microsoft.com/v1.0/me',
      {
        headers: {
          Authorization: `Bearer ${tokenResponse.accessToken}`,
        },
      }
    );

    const userInfo = await userInfoResponse.json();

    // Get profile photo URL
    let photoUrl: string | undefined;
    try {
      const photoResponse = await fetch(
        'https://graph.microsoft.com/v1.0/me/photo/$value',
        {
          headers: {
            Authorization: `Bearer ${tokenResponse.accessToken}`,
          },
        }
      );
      if (photoResponse.ok) {
        const photoBlob = await photoResponse.blob();
        // Convert blob to base64 data URL
        photoUrl = URL.createObjectURL(photoBlob);
      }
    } catch {
      // Photo not available
    }

    const user: User = {
      id: userInfo.id,
      email: userInfo.mail || userInfo.userPrincipalName,
      displayName: userInfo.displayName,
      photoUrl,
      provider: 'microsoft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return {
      user,
      accessToken: tokenResponse.accessToken,
      refreshToken: tokenResponse.refreshToken,
    };
  }

  // Apple Sign In
  async signInWithApple(): Promise<AuthResult> {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // Apple only provides name/email on first sign in
      // Store and retrieve from secure storage for subsequent logins
      const displayName =
        credential.fullName?.givenName && credential.fullName?.familyName
          ? `${credential.fullName.givenName} ${credential.fullName.familyName}`
          : credential.email?.split('@')[0] || 'Apple User';

      const user: User = {
        id: credential.user,
        email: credential.email || '',
        displayName,
        provider: 'apple',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return {
        user,
        accessToken: credential.identityToken || '',
        refreshToken: credential.authorizationCode || undefined,
      };
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        throw new Error('Apple sign in was cancelled');
      }
      throw error;
    }
  }

  // Check if Apple Sign In is available
  async isAppleSignInAvailable(): Promise<boolean> {
    return await AppleAuthentication.isAvailableAsync();
  }

  // Refresh Google token
  async refreshGoogleToken(refreshToken: string): Promise<string> {
    const tokenResponse = await AuthSession.refreshAsync(
      {
        clientId: OAUTH_CONFIG.google.clientId,
        refreshToken,
      },
      googleDiscovery
    );

    return tokenResponse.accessToken;
  }

  // Refresh Microsoft token
  async refreshMicrosoftToken(refreshToken: string): Promise<string> {
    const tokenResponse = await AuthSession.refreshAsync(
      {
        clientId: OAUTH_CONFIG.microsoft.clientId,
        refreshToken,
      },
      microsoftDiscovery
    );

    return tokenResponse.accessToken;
  }

  // Revoke Google token
  async revokeGoogleToken(token: string): Promise<void> {
    await AuthSession.revokeAsync(
      { token },
      { revocationEndpoint: googleDiscovery.revocationEndpoint }
    );
  }

  // Generate a secure random state for OAuth
  async generateState(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    return Array.from(randomBytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }
}

export const AuthService = new AuthServiceClass();
