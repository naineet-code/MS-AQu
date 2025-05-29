import os
from openai import AzureOpenAI

# Test credentials
endpoint = "https://increff-ai.openai.azure.com/"
api_key = "41qtSYKs072orPsHdIZeosQHW6vGzHCOfV0KGCTeMIKmtmc8qtLRJQQJ99BEACHYHv6XJ3w3AAABACOGTTy1"
api_version = "2024-12-01-preview"
deployment = "gpt-4.1"

def test_credentials():
    try:
        # Initialize the client
        client = AzureOpenAI(
            api_version=api_version,
            azure_endpoint=endpoint,
            api_key=api_key,
        )

        # Test a simple chat completion
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are a helpful assistant.",
                },
                {
                    "role": "user",
                    "content": "Hello, this is a test message.",
                }
            ],
            max_completion_tokens=100,
            temperature=0.7,
            model=deployment
        )

        print("✅ Credentials are valid!")
        print("Response:", response.choices[0].message.content)
        return True

    except Exception as e:
        print("❌ Credentials are invalid!")
        print("Error:", str(e))
        return False

if __name__ == "__main__":
    test_credentials() 