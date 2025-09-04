const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { google } = require("googleapis");
const User = require('../backend/model/User');

// 👇 helper function to fetch Google contacts
async function fetchGoogleContacts(accessToken) {
  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: accessToken });

  const people = google.people({ version: "v1", auth: oauth2Client });

  const res = await people.people.connections.list({
    resourceName: "people/me",
    personFields: "names,emailAddresses,phoneNumbers",
    pageSize: 500,
  });

  if (!res.data.connections) return [];

  return res.data.connections.map(c => ({
    name: c.names?.[0]?.displayName || "Unknown",
    email: c.emailAddresses?.[0]?.value || null,
    phone: c.phoneNumbers?.[0]?.value || null
  }));
}

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      scope: [
        "profile",
        "email",
        "https://www.googleapis.com/auth/contacts.readonly" // 👈 important
      ],
       prompt: "consent",
       accessType: "offline"
    },
    async (accessToken, refreshToken, profile, done) => {
      try {

        let user = await User.findOne({ googleId: profile.id });

        if (!user) {
          const email =
            (profile.emails && profile.emails.length > 0 && profile.emails[0].value) ||
            profile._json.email ||
            null;

               user = new User({
                googleId: profile.id,
                username: profile.displayName, // must match schema
                email: email,
              // default role, must match enum ['freelancer','client']
              });

          await user.save();
        }

        // 👇 Fetch Google contacts and save to DB
        const contacts = await fetchGoogleContacts(accessToken);
        if (contacts.length > 0) {
          await User.findByIdAndUpdate(
            user._id,
            { $set: { contacts } },
            { new: true }
          );
        }

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});
