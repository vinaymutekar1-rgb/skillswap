# SkillSwap

Hyperlocal skill exchange platform for college students.

## Features

- **Student Skill Profiles** — Create your profile with skills you can teach and want to learn
- **Smart Skill Matching** — Algorithm-based compatibility scoring between students
- **Skill Exchange Requests** — Send, accept, reject, and manage swap requests
- **Real-time Chat** — Message your learning partners directly
- **Session Scheduling** — Plan and manage learning sessions with date, time, and mode
- **Learning Credits** — Earn credits for teaching, track your balance
- **Ratings & Reviews** — Rate sessions and build your reputation
- **Skill Verification** — Verified skills based on completed sessions
- **Progress Tracking** — Monitor your learning goals and milestones
- **Leaderboard** — See top contributors by credits, sessions, and ratings
- **Notifications** — Stay updated on requests, sessions, and messages
- **Admin Panel** — Platform statistics and demo data management

## Tech Stack

- **HTML5** — Semantic markup
- **CSS3** — Custom properties, Grid, Flexbox, animations
- **Vanilla JavaScript** — No frameworks, no dependencies
- **localStorage** — Client-side data persistence

## Project Structure

```
SkillSwap/
├── index.html          # Main HTML file
├── css/
│   └── styles.css      # All styling
├── js/
│   └── app.js          # Application logic
├── assets/
│   ├── logo.svg        # Brand logo
│   ├── favicon.svg     # Browser tab icon
│   └── images/         # Image assets
├── README.md           # This file
├── .gitignore          # Git ignore rules
└── LICENSE             # MIT License
```

## Running Locally

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/skillswap.git
   cd skillswap
   ```

2. Open `index.html` in your browser:
   ```bash
   # macOS
   open index.html
   
   # Windows
   start index.html
   
   # Linux
   xdg-open index.html
   ```

**Optional:** Use VS Code Live Server for the best experience with auto-reload.

## Deployment (GitHub Pages)

1. Push your code to GitHub
2. Go to **Settings** → **Pages**
3. Under **Source**, select **Deploy from a branch**
4. Choose **main** branch and **/ (root)** folder
5. Click **Save**

Your site will be live at: `https://yourusername.github.io/skillswap/`

## Important Note

This prototype uses **localStorage** for data persistence. All data is stored in your browser and will be lost if you clear your browser data.

For a production deployment, replace the `DataStore` with **Firebase/Firestore** or another backend service to enable:
- User authentication
- Persistent data across devices
- Real-time updates
- Multi-user support

## Developed by
Vinay Mutekar

## License

MIT License — see [LICENSE](./LICENSE) for details.
