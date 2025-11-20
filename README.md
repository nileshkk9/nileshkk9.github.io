# macOS Portfolio

An interactive, macOS-inspired portfolio website built with React and Vite. Experience a fully functional desktop environment where you can explore my work, skills, and experience through familiar macOS applications like Finder, Safari, and Terminal.

## 🚀 Features

### Core Applications

- **Finder**: Browse through projects, work experience, and files in a familiar file system interface
- **Safari**: View portfolio content including About, Experience, Projects, Skills, and Education sections
- **Terminal**: Interactive command-line interface with custom commands to explore portfolio information
- **Settings**: System preferences and customization options

### Interactive Elements

- **Window Management**: Drag, resize, minimize, maximize, and close windows
- **Menu Bar**: Fully functional macOS-style menu bar with File, Edit, View, Go, Window, and Help menus
- **Dock**: Quick access to applications with hover effects and indicators
- **Spotlight Search**: Press `Cmd+K` or `Ctrl+K` to quickly search and open applications
- **Desktop Icons**: Interactive desktop shortcuts to key resources

### Portfolio Content

- **Work Experience**: Detailed timeline of professional roles and achievements
- **Projects**: Showcase of projects with descriptions and links
- **Skills**: Interactive visualization of technical skills across languages, frameworks, tools, and databases
- **Education**: Academic background and certifications
- **Contact**: Multiple ways to get in touch (email, LinkedIn, GitHub)

## 🛠️ Tech Stack

- **React 19** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icon library
- **ESLint** - Code linting

## 📦 Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd portfolio
```

2. Install dependencies:

```bash
npm install
# or
yarn install
```

3. Start the development server:

```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## 🎮 Usage

### Keyboard Shortcuts

- `Cmd+K` / `Ctrl+K` - Open Spotlight Search
- `Cmd+?` / `Ctrl+?` - Show keyboard shortcuts help
- `Cmd+W` / `Ctrl+W` - Close active window (coming soon)
- `Cmd+M` / `Ctrl+M` - Minimize active window (coming soon)

### Terminal Commands

Open Terminal and try these commands:

- `help` - Show available commands
- `whoami` - Display user information
- `about` - Show summary
- `contact` - Display contact details
- `experience` - Show work history
- `skills` - Display tech stack
- `projects` - List projects
- `ls` - List directories
- `clear` - Clear terminal

### Navigation Tips

- Double-click desktop icons to open applications
- Click dock icons to launch or focus applications
- Use Finder to browse files and folders
- Navigate Safari using the sidebar menu
- Drag windows by their title bars
- Use window controls (red, yellow, green buttons) to manage windows

## 🏗️ Build

To build for production:

```bash
npm run build
# or
yarn build
```

The built files will be in the `dist` directory.

## 📝 Project Structure

```
portfolio/
├── src/
│   ├── App.jsx          # Main application component
│   ├── App.css          # Application styles
│   ├── main.jsx         # Entry point
│   └── index.css        # Global styles
├── public/              # Static assets
├── index.html           # HTML template
├── package.json         # Dependencies and scripts
├── tailwind.config.js   # Tailwind configuration
└── vite.config.js       # Vite configuration
```

## 🎨 Customization

### Updating Portfolio Content

Edit the `USER_DATA` object in `src/App.jsx` to update:

- Personal information
- Work experience
- Projects
- Skills
- Social media links

### Styling

The project uses Tailwind CSS. Modify `tailwind.config.js` to customize the design system.

## 🚢 Deployment

### GitHub Pages (Recommended)

This project is configured for automatic deployment to GitHub Pages using GitHub Actions.

#### Initial Setup

1. **Update the base path** in `vite.config.js`:

   - If your repository is `username.github.io`, set `REPO_NAME = ''`
   - If your repository is `portfolio` (or any other name), set `REPO_NAME = 'portfolio'`

2. **Enable GitHub Pages**:

   - Go to your repository on GitHub
   - Navigate to **Settings** → **Pages**
   - Under **Source**, select **GitHub Actions**
   - Save the settings

3. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

4. **Automatic Deployment**:
   - The GitHub Actions workflow will automatically build and deploy your site
   - Check the **Actions** tab in your repository to see the deployment status
   - Your site will be available at:
     - `https://username.github.io/portfolio/` (if repo name is "portfolio")
     - `https://username.github.io/` (if repo is "username.github.io")

#### Manual Deployment (Alternative)

If you prefer to deploy manually:

```bash
# Install dependencies (if not already installed)
yarn install

# Build the project
yarn build

# Deploy to GitHub Pages
yarn deploy
```

#### Other Deployment Options

- **Vercel**: Connect your GitHub repository
- **Netlify**: Drag and drop the `dist` folder or connect your GitHub repository
- **AWS S3**: Upload the `dist` folder to an S3 bucket

## 📄 License

This project is open source and available under the MIT License.

## 👤 Author

**Nilesh Kumar Pandey**

- Email: nileshkk9@gmail.com
- LinkedIn: [linkedin.com/in/nilesh-kumar-pandey](https://linkedin.com/in/nilesh-kumar-pandey)
- GitHub: [github.com/nileshkk9](https://github.com/nileshkk9)

---

Built with ❤️ using React and Vite
