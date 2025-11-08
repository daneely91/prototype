# Gameplay Analysis Application

## Overview
This application analyzes gameplay videos using AI to provide actionable feedback for gamers. It processes video uploads, extracts key frames, and uses Google's Gemini Vision API to analyze gameplay moments and provide improvement suggestions.

## Getting Started

### Prerequisites
- Node.js 18 or later
- A Google Cloud Platform account with Gemini API access
- Docker (optional, for development container)

### Environment Setup
1. Create a `.env` file in the project root:
```bash
# Required environment variables
GOOGLE_API_KEY=your-api-key-here
NODE_ENV=development
MAX_UPLOAD_SIZE=100
```

2. Get your Google API key:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create/select a project
   - Enable the Gemini API
   - Create credentials (API key)
   - Copy the key to your `.env` file

### Project Structure
```
my-vscode-workspace/
├── src/
│   ├── app/          # Next.js app directory
│   ├── components/   # React components
│   ├── services/     # Business logic and services
│   └── types/        # TypeScript type definitions
├── uploads/          # Video upload storage (gitignored)
└── public/          # Static assets
```

## Setup Instructions
1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd my-vscode-workspace
   ```

2. **Open in Visual Studio Code**
   Open the workspace file `my-vscode-workspace.code-workspace` in Visual Studio Code.

3. **Install Recommended Extensions**
   When prompted, install the recommended extensions listed in `.vscode/extensions.json`.

4. **Build the Development Container**
   If using the development container, open the Command Palette (Ctrl+Shift+P) and select "Remote-Containers: Reopen in Container".

## Usage
- The main application logic can be found in `src/main.ts`.
- Use the provided launch configurations in `.vscode/launch.json` to debug the application.

## Contributing
Feel free to submit issues or pull requests for improvements or bug fixes.

## License
This project is licensed under the MIT License.