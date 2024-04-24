/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    customKey: "my-value",
    TOKEN_OWNER: "EbkQ2uzFzvobU7C4ZBZHP3hS6PTdQRreL4CXztDJfMxR",
    FROM_ASSOCIATED_TOKEN_ACCOUNT:
      "Hsjbftz2xXRnGk7q7WsrYUfuDod8XWaSvxb1ome9j8ZZ",
    MINT_ID: "Gh9ZwEmdLJ8DscKNTkTqPbNwLNNBjuSzaG9Vp2KGtKJr",
    SECRET_KEY:
      "PiqnTsrewFMpT1pzmRrF2jy6NPB3q32NfZkB5zdfsK5Q9VN2z8xDN2X5sU4UAHEHq3wRMMs6uDjYaZAE8thc4g9",
  },
};

module.exports = nextConfig;
