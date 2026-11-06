// SPDX-License-Identifier: GPL-3.0-or-later
// Copyright (c) 2026 Parsa Kamalipour
// Public IDs for cloud sync. None of these are secrets: every visitor's browser needs them to sign in.
window.SYNC_CONFIG = {
  GOOGLE_CLIENT_ID: "305235627631-togsnctsom0ba7ctcdsit792jnnd24c7.apps.googleusercontent.com",
  TOKEN_HELPER_URL: "https://petitfrench-token-helper.token-helper.workers.dev",
  CK_CONTAINER: "iCloud.com.parsakp.petitfrench",
  CK_API_TOKEN: "7b16511f666202dd83a1c0744b090ffa7af7b1c85b2ac4e675715928d82b3917",
  CK_ENV: "development", // switch to "production" after deploying the CloudKit schema
};
