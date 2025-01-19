import os
from py_clob_client.client import ClobClient

def main():
    host = "https://clob.polymarket.com"
    key = os.getenv("POLYMARKET_PRIVATE_KEY")
    chain_id = 137  # Polygon Mainnet chain ID

    # Ensure the private key is loaded correctly
    if not key:
        raise ValueError("Private key not found. Please set PK in the environment variables.")

    # Initialize the client with your private key
    client = ClobClient(host, key=key, chain_id=chain_id)

    # Create or derive API credentials
    try:
        api_creds = client.create_or_derive_api_creds()
        print("export POLYMARKET_API_KEY="+api_creds.api_key)
        print("export POLYMARKET_API_SECRET=\""+api_creds.api_secret+"\"")
        print("export POLYMARKET_API_PASSPHRASE="+api_creds.api_passphrase)

        # Save these securely (e.g., store them in your .env file)
    except Exception as e:
        print("Error creating or deriving API credentials:", e)

if __name__ == "__main__":
    main()
