# LifeTuner 📊

A modern, comprehensive habit tracking and life optimization application that helps you monitor daily patterns and improve your quality of life through data-driven insights.

## 🌟 Features

### Core Functionality

- **Daily Habit Tracking**: Monitor sleep patterns, mood, energy levels, and daily activities
- **Smart Analytics**: Visualize your data with interactive charts and graphs
- **AI Personal Coach**: Get personalized recommendations based on your habits and current state
- **Progress Tracking**: Visual progress indicators and streak counters
- **Goal Setting**: Set and track personal wellness goals

### User Experience

- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- **Dark/Light Theme**: Toggle between themes for comfortable viewing
- **PWA Support**: Install as a Progressive Web App for native-like experience
- **Offline Capability**: Continue tracking even when offline
- **Smart Reminders**: Customizable notifications to maintain consistency

### Data Management

- **Local Storage**: All data stored securely in your browser
- **Export Options**: Export your data in JSON or CSV formats
- **Data Privacy**: No data leaves your device - complete privacy

## 🚀 Getting Started

### Prerequisites

- Modern web browser (Chrome, Firefox, Safari, Edge)
- No installation required - runs entirely in your browser

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/lifetuner.git
cd lifetuner
```

2. Open `index.html` in your web browser or serve with a local web server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx http-server

# Using PHP
php -S localhost:8000
```

3. Navigate to `http://localhost:8000` in your browser

### First Time Setup

1. Complete the onboarding process to learn about the features
2. Set your personal goals in the Settings section
3. Configure reminders if desired
4. Start tracking your first day!

## 📱 Usage

### Daily Tracking

1. **Sleep Monitoring**: Enter your bedtime and wake time
2. **Mood Assessment**: Select your current mood (1-5 scale)
3. **Energy Level**: Rate your energy on a 1-10 scale
4. **Activities**: Choose from 8 different activity types
5. **Save**: Click "Save Today's Data" to store your entries

### Analytics Dashboard

- View weekly trends for energy and mood
- Analyze your most frequent activities
- Discover your peak energy hours
- Get insights about your patterns

### AI Coach

1. Select your current feeling state
2. Receive personalized recommendations
3. Get daily motivational quotes
4. Access situation-specific advice

### Settings & Goals

- Set sleep, energy, exercise, and mood targets
- Configure reminder times and frequency
- Export your data for external analysis
- Manage theme preferences

## 🛠️ Technical Details

### Architecture

- **Frontend**: Vanilla JavaScript with modern ES6+ features
- **Styling**: Tailwind CSS with custom animations
- **Charts**: Chart.js for data visualization
- **Storage**: Browser localStorage for data persistence
- **PWA**: Service worker for offline functionality

### Key Components

- **LifeTuner**: Main application class
- **UIManager**: Handles user interface interactions
- **DataManager**: Manages data storage and export
- **AnalyticsEngine**: Processes data for insights
- **AICoach**: Provides personalized recommendations
- **NotificationManager**: Handles toast notifications
- **ThemeManager**: Manages dark/light theme switching
- **ReminderManager**: Handles notification scheduling
