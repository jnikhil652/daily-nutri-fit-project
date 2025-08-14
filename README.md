# DailyNutriFit

> **Personalized fruit delivery app that helps health-conscious individuals meet their nutritional needs through AI-powered recommendations, family coordination, and community engagement.**

## Overview

DailyNutriFit transforms healthy eating from a daily struggle into an enjoyable, social experience. Our app delivers fresh, quality fruits tailored to individual health profiles while fostering community engagement through challenges, family plans, and shared wellness journeys.

## Key Features

### 🎯 Health-Focused Personalization
- AI-powered fruit recommendations based on health profiles
- Custom health assessments and goal tracking
- Nutritional analysis and progress monitoring

### 👨‍👩‍👧‍👦 Family & Social Features
- Family plans with individual health profiles
- Community challenges and healthy competitions
- Referral system with rewards and incentives

### 📱 Advanced Customization
- Drag-and-drop custom delivery plan builder
- Flexible scheduling with pause/resume options
- Seasonal recommendations and variety optimization

### 🏥 Professional Support
- Verified nutritionist directory
- Video consultation scheduling
- Expert guidance integration

## Tech Stack

- **Mobile Framework:** React Native with Expo
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Payment Processing:** Stripe
- **Push Notifications:** Expo Notifications
- **Deployment:** Expo Application Services (EAS)

## Project Structure

```
daily-nutri-fit-project/
├── .agent-os/                    # Agent OS documentation
│   ├── product/                  # Product vision & roadmap
│   │   ├── mission.md
│   │   ├── tech-stack.md
│   │   ├── roadmap.md
│   │   └── decisions.md
│   └── specs/                    # Feature specifications
│       ├── 2025-08-15-health-personalization/
│       ├── 2025-08-15-custom-plans-advanced/
│       └── 2025-08-15-social-engagement/
├── CLAUDE.md                     # AI development assistant configuration
└── README.md
```

## Development Phases

### Phase 1: Core MVP ✅
- User authentication and profiles
- Basic fruit catalog and ordering
- Wallet system and payment integration

### Phase 2: Health Personalization 📋
- Health profile setup and assessments
- AI-powered fruit recommendations
- Subscription plans and delivery scheduling

### Phase 3: Custom Plans & Advanced Features 📋
- Custom delivery plan builder
- Comprehensive nutritional tracking
- Advanced delivery management

### Phase 4: Social & Engagement Features 📋
- Family plans and multi-user accounts
- Referral system and community challenges
- Recipe sharing and social achievements

### Phase 5: Enterprise & Scale Features 📋
- Corporate wellness programs
- Advanced analytics and insights
- Third-party integrations

## Agent OS Integration

This project uses [Agent OS](https://buildermethods.com/agent-os) for structured AI-assisted development:

- **Product Documentation:** Complete mission, roadmap, and technical specifications
- **Feature Specs:** Detailed technical requirements and task breakdowns
- **Development Standards:** Code style, best practices, and quality guidelines

## Getting Started

### Prerequisites
- Node.js 22 LTS
- Expo CLI
- Git

### Development Setup

1. **Clone the repository:**
   ```bash
   git clone https://github.com/jnikhil652/daily-nutri-fit-project.git
   cd daily-nutri-fit-project
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   expo start
   ```

## Contributing

This project follows Agent OS development practices:

1. **Check the roadmap:** Review `@.agent-os/product/roadmap.md` for current priorities
2. **Create feature specs:** Use `@.agent-os/instructions/create-spec.md` for new features
3. **Follow standards:** Adhere to guidelines in `.agent-os/standards/`

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For questions or support:
- Review the [product documentation](.agent-os/product/)
- Check [feature specifications](.agent-os/specs/)
- Create an issue for bugs or feature requests

---

*Built with ❤️ for healthier communities*