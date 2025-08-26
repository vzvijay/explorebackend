# 🚀 Free Hosting Deployment Guide: Vercel + Railway

This guide will help you deploy your Maharashtra Survey Management System to **Vercel (Frontend)** and **Railway (Backend)** completely free!

## 📋 Prerequisites

- GitHub account
- Vercel account (free)
- Railway account (free)
- Node.js installed locally

## 🎯 Step-by-Step Deployment

### **Phase 1: Deploy Backend to Railway**

1. **Create Railway Account**
   - Go to [railway.app](https://railway.app)
   - Sign up with GitHub
   - Create a new project

2. **Set Up PostgreSQL Database**
   - In Railway dashboard, click "New Service"
   - Select "Database" → "PostgreSQL"
   - Note down the connection details

3. **Deploy Backend Code**
   ```bash
   # Make script executable
   chmod +x deploy-railway.sh
   
   # Run deployment
   ./deploy-railway.sh
   ```

4. **Configure Environment Variables**
   - In Railway dashboard, go to your backend service
   - Add environment variables from `backend/env.railway`
   - Update with your actual database credentials
   - Generate a secure JWT_SECRET

5. **Get Your Backend URL**
   - Railway will provide a URL like: `https://your-app-name.railway.app`
   - Note this URL for the next step

### **Phase 2: Deploy Frontend to Vercel**

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub
   - Import your repository

2. **Configure Environment Variables**
   - In Vercel dashboard, go to Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-app-name.railway.app/api`

3. **Deploy Frontend**
   ```bash
   # Make script executable
   chmod +x deploy-vercel.sh
   
   # Run deployment
   ./deploy-vercel.sh
   ```

4. **Get Your Frontend URL**
   - Vercel will provide a URL like: `https://your-app-name.vercel.app`

### **Phase 3: Final Configuration**

1. **Update CORS in Railway**
   - Go back to Railway backend service
   - Update `CORS_ORIGIN` with your Vercel frontend URL

2. **Test Your Application**
   - Visit your Vercel frontend URL
   - Test login and API functionality
   - Check browser console for any CORS errors

## 🔒 Security Features (All Free)

- **SSL Certificates**: Automatic HTTPS
- **CORS Protection**: Configured for your domains only
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Helmet Security**: Security headers
- **Input Validation**: Joi validation middleware
- **JWT Authentication**: Secure token-based auth

## 📊 Free Tier Limits

### **Vercel (Frontend)**
- ✅ Unlimited deployments
- ✅ Custom domains
- ✅ SSL certificates
- ✅ Global CDN
- ✅ 100GB bandwidth/month
- ✅ Automatic builds from Git

### **Railway (Backend)**
- ✅ 500 hours/month
- ✅ Custom domains
- ✅ SSL certificates
- ✅ PostgreSQL database
- ✅ Automatic deployments
- ✅ Health checks

## 🚨 Important Notes

1. **Database Persistence**: Railway free tier may reset data periodically
2. **Uptime**: Free tiers have some limitations on continuous uptime
3. **Bandwidth**: Monitor usage to stay within free limits
4. **Backup**: Consider backing up important data

## 🔧 Troubleshooting

### **Common Issues**

1. **CORS Errors**
   - Ensure `CORS_ORIGIN` in Railway matches your Vercel URL exactly
   - Check for trailing slashes

2. **Database Connection Issues**
   - Verify database credentials in Railway
   - Check if database service is running

3. **Build Failures**
   - Ensure all dependencies are in `package.json`
   - Check Node.js version compatibility

### **Support Resources**
- [Vercel Documentation](https://vercel.com/docs)
- [Railway Documentation](https://docs.railway.app)
- [GitHub Issues](https://github.com/your-repo/issues)

## 🎉 Success!

Once deployed, your application will be:
- 🌐 Accessible from anywhere
- 🔒 Secure with HTTPS
- 📱 Responsive and fast
- 💰 Completely free to host

## 📝 Next Steps

1. **Custom Domain**: Add your own domain (optional)
2. **Monitoring**: Set up basic monitoring
3. **Backup Strategy**: Implement data backup
4. **CI/CD**: Set up automatic deployments from Git

---

**Happy Deploying! 🚀**
