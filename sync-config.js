// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Public IDs for cloud sync. None of these are secrets: every visitor's browser needs them to sign in.
window.SYNC_CONFIG = {
  GOOGLE_CLIENT_ID: "305235627631-togsnctsom0ba7ctcdsit792jnnd24c7.apps.googleusercontent.com",
  TOKEN_HELPER_URL: "https://petitfrench-token-helper.token-helper.workers.dev",
  CK_CONTAINER: "iCloud.com.parsakp.petitfrench",
  CK_API_TOKEN: "e6578d4004a4e28441fe54ac39ab8789b32f46025df1b2c5318890db6d28f676", // Production token (each environment has its own)
  CK_ENV: "production",
};
