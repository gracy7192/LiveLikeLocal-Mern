const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

dotenv.config();

const User = require('./models/User');
const Listing = require('./models/Listing');

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if data already exists to prevent accidental wipe
    const userCount = await User.countDocuments();
    const listingCount = await Listing.countDocuments();

    if (userCount > 0 || listingCount > 0) {
      if (!process.argv.includes('--force')) {
        console.log('Database already contains data. Use "node seed.js --force" to wipe and re-seed.');
        process.exit(0);
      }
      console.log('Force flag detected. Clearing existing data...');
      await User.deleteMany({});
      await Listing.deleteMany({});
    }

    // Create admin
    const admin = await User.create({
      name: 'Admin',
      email: 'admin@livelikelocals.com',
      password: 'admin123',
      role: 'admin',
    });

    // Create hosts
    const host1 = await User.create({
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      password: 'host123',
      role: 'host',
      bio: 'I run a traditional homestay in Jaipur. Come experience Rajasthani culture!',
      location: { city: 'Jaipur', state: 'Rajasthan' },
    });

    const host2 = await User.create({
      name: 'Priya Sharma',
      email: 'priya@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Kerala backwater experiences and authentic South Indian cooking classes.',
      location: { city: 'Alleppey', state: 'Kerala' },
    });

    const host3 = await User.create({
      name: 'Amit Patel',
      email: 'amit@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Discover the vibrant festivals and streets of Gujarat with me!',
      location: { city: 'Ahmedabad', state: 'Gujarat' },
    });

    const host4 = await User.create({
      name: 'Maria D\'Souza',
      email: 'maria@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Beach lover and local history buff in Goa. I\'ll show you the hidden gems of coastal life!',
      location: { city: 'Panaji', state: 'Goa' },
    });

    const host5 = await User.create({
      name: 'Sunil Negi',
      email: 'sunil@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Life in the mountains is beautiful. Experience Himachali hospitality and orchard life with us.',
      location: { city: 'Manali', state: 'Himachal Pradesh' },
    });

    const host6 = await User.create({
      name: 'Vikram Deshmukh',
      email: 'vikram@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Passionate about Indian heritage and architecture. Let\'s explore the caves of Maharashtra.',
      location: { city: 'Aurangabad', state: 'Maharashtra' },
    });

    const host7 = await User.create({
      name: 'Anjali Das',
      email: 'anjali@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Welcome to the Sundarbans! Experience the wild and the local culture of Bengal.',
      location: { city: 'Sajnekhali', state: 'West Bengal' },
    });

    const host8 = await User.create({
      name: 'Karthik Subramanian',
      email: 'karthik@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Deeply connected to the spiritual and architectural history of Madurai.',
      location: { city: 'Madurai', state: 'Tamil Nadu' },
    });

    const host9 = await User.create({
      name: 'Suresh Gowda',
      email: 'suresh@example.com',
      password: 'host123',
      role: 'host',
      bio: 'Lover of history and adventure in the ruins of Hampi.',
      location: { city: 'Hampi', state: 'Karnataka' },
    });

    // Create traveler
    const traveler = await User.create({
      name: 'Sarah Johnson',
      email: 'sarah@example.com',
      password: 'traveler123',
      role: 'traveler',
      interests: ['culture', 'food', 'festivals', 'art'],
    });

    // Create listings
    const listings = await Listing.insertMany([
      {
        host: host1._id,
        title: 'Royal Rajasthani Haveli Stay',
        description: 'Experience the grandeur of Rajasthani architecture in a 200-year-old haveli. Includes traditional Rajasthani meals, folk dance performances, and a guided tour of the old city.',
        price: 2500,
        category: 'homestay',
        tags: ['culture', 'history', 'food', 'art'],
        location: { city: 'Jaipur', state: 'Rajasthan', address: 'Old City, Jaipur', lat: 26.9124, lng: 75.7873 },
        images: [{ url: 'https://images.unsplash.com/photo-1524492412937-b28074a5d7da?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.5,
        numReviews: 12,
        viewCount: 45,
      },
      {
        host: host2._id,
        title: 'Kerala Backwater Houseboat Experience',
        description: 'Cruise through the serene backwaters of Alleppey on a traditional houseboat. Enjoy fresh seafood, watch sunset over the paddy fields, and wake up to bird songs.',
        price: 4000,
        category: 'experience',
        tags: ['nature', 'food', 'adventure'],
        location: { city: 'Alleppey', state: 'Kerala', address: 'Backwater Canal Road', lat: 9.4981, lng: 76.3388 },
        images: [{ url: 'https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.8,
        numReviews: 28,
        viewCount: 120,
      },
      {
        host: host1._id,
        title: 'Pushkar Camel Fair Experience',
        description: 'Join the world-famous Pushkar Camel Fair! Witness camel trading, folk performances, and sacred rituals at Pushkar Lake. Limited slots available.',
        price: 3500,
        category: 'festival',
        tags: ['culture', 'festivals', 'adventure'],
        location: { city: 'Pushkar', state: 'Rajasthan', address: 'Pushkar Fairgrounds', lat: 26.4899, lng: 74.5542 },
        images: [{ url: 'https://images.unsplash.com/photo-1548013146-72479768bada?w=800', publicId: '' }],
        status: 'approved',
        festivalName: 'Pushkar Camel Fair',
        festivalDates: { start: new Date('2026-11-01'), end: new Date('2026-11-09') },
        maxSlots: 10,
        bookingCutoff: new Date('2026-10-25'),
        avgRating: 4.7,
        numReviews: 8,
        viewCount: 35,
      },
      {
        host: host3._id,
        title: 'Navratri Dance Festival in Gujarat',
        description: 'Experience 9 nights of Garba and Dandiya Raas in Ahmedabad! Includes traditional outfits, dance lessons, and authentic Gujarati food.',
        price: 2000,
        category: 'festival',
        tags: ['culture', 'festivals', 'music', 'food'],
        location: { city: 'Ahmedabad', state: 'Gujarat', address: 'GMDC Ground', lat: 23.0225, lng: 72.5714 },
        images: [{ url: 'https://images.unsplash.com/photo-1514222134-b57cbb8ce073?w=800', publicId: '' }],
        status: 'approved',
        festivalName: 'Navratri',
        festivalDates: { start: new Date('2026-10-15'), end: new Date('2026-10-23') },
        maxSlots: 15,
        bookingCutoff: new Date('2026-10-10'),
        avgRating: 4.9,
        numReviews: 15,
        viewCount: 89,
      },
      {
        host: host2._id,
        title: 'Cooking Class with a Kerala Family',
        description: 'Learn to make authentic Kerala dishes – appam, fish curry, payasam and more! Cook alongside a local family and dine together.',
        price: 1500,
        category: 'experience',
        tags: ['food', 'culture'],
        location: { city: 'Kochi', state: 'Kerala', address: 'Fort Kochi', lat: 9.9312, lng: 76.2673 },
        images: [{ url: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.6,
        numReviews: 20,
        viewCount: 8,
      },
      {
        host: host4._id,
        title: 'Goan Beach Shack & Feni Making',
        description: 'Stay in a cozy beach shack in South Goa. Learn the traditional art of making Feni from cashews and enjoy authentic Goan fish curry.',
        price: 3200,
        category: 'experience',
        tags: ['beach', 'culture', 'food'],
        location: { city: 'Palolem', state: 'Goa', address: 'Palolem Beach South', lat: 15.0099, lng: 74.0232 },
        images: [{ url: 'https://plus.unsplash.com/premium_photo-1697729594707-0fc9e51c8eed?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', publicId: '' }],
        status: 'approved',
        avgRating: 4.7,
        numReviews: 14,
        viewCount: 22,
      },
      {
        host: host5._id,
        title: 'Apple Orchard Homestay in Manali',
        description: 'Wake up to the view of snow-capped mountains and apple blossoms. Stay with a local family, enjoy wood-fired meals, and go on a trek to Jogini falls.',
        price: 2800,
        category: 'homestay',
        tags: ['mountains', 'nature', 'food'],
        location: { city: 'Manali', state: 'Himachal Pradesh', address: 'Vashisht Road', lat: 32.2432, lng: 77.1892 },
        images: [{ url: 'https://images.unsplash.com/photo-1594142404563-64cccaf5a10f?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.9,
        numReviews: 32,
        viewCount: 56,
      },
      {
        host: host6._id,
        title: 'Heritage Tour of Ajanta & Ellora',
        description: 'A deep dive into the history of Buddhist and Hindu cave architecture. Guided tour by an local expert, stay in a heritage bungalow, and explore local crafts.',
        price: 4500,
        category: 'experience',
        tags: ['history', 'art', 'culture'],
        location: { city: 'Aurangabad', state: 'Maharashtra', address: 'Near Ellora Caves', lat: 20.0258, lng: 75.1771 },
        images: [{ url: 'https://images.unsplash.com/photo-1590766940554-634a7ed41450?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.8,
        numReviews: 19,
        viewCount: 38,
      },
      {
        host: host7._id,
        title: 'Sundarbans Mangrove Safari',
        description: 'Explore the world\'s largest mangrove forest! Stay in an eco-resort, go on boat safaris to spot Royal Bengal Tigers, and experience Baul music by the campfire.',
        price: 3800,
        category: 'experience',
        tags: ['nature', 'wildlife', 'culture'],
        location: { city: 'Gosaba', state: 'West Bengal', address: 'Sundarbans Tiger Reserve', lat: 22.1648, lng: 88.7909 },
        images: [{ url: 'https://images.unsplash.com/photo-1571679654681-ba01b9e1e117?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', publicId: '' }],
        status: 'approved',
        avgRating: 4.6,
        numReviews: 25,
        viewCount: 62,
      },
      {
        host: host8._id,
        title: 'Dravidian Architecture Tour in Madurai',
        description: 'Witness the majesty of Meenakshi Amman Temple. Stay in a traditional Tamil home, enjoy authentic Madurai jasmine, and learn about the Sangam literature.',
        price: 2200,
        category: 'experience',
        tags: ['culture', 'religion', 'art'],
        location: { city: 'Madurai', state: 'Tamil Nadu', address: 'Temple Road', lat: 9.9195, lng: 78.1193 },
        images: [{ url: 'https://images.unsplash.com/photo-1582510003544-4d00b7f74220?w=800', publicId: '' }],
        status: 'approved',
        avgRating: 4.7,
        numReviews: 11,
        viewCount: 29,
      },
      {
        host: host9._id,
        title: 'Hampi Ruins & Bouldering',
        description: 'Experience the remains of the Vijayanagara Empire. Stay in a guest house across the river (Hippie Island), explore the temples on bicycles, and try bouldering.',
        price: 1800,
        category: 'homestay',
        tags: ['history', 'adventure', 'art'],
        location: { city: 'Hampi', state: 'Karnataka', address: 'Virupaksha Temple Area', lat: 15.335, lng: 76.46 },
        images: [{ url: 'https://images.unsplash.com/photo-1659126574791-13313aa424bd?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', publicId: '' }],
        status: 'approved',
        avgRating: 4.9,
        numReviews: 22,
        viewCount: 47,
      },
    ]);

    console.log('Database seeded successfully!');
    console.log(`Created: ${listings.length} listings`);
    console.log('\n--- Login Credentials ---');
    console.log('Admin: admin@livelikelocals.com / admin123');
    console.log('Host 1: rajesh@example.com / host123');
    console.log('Host 2: priya@example.com / host123');
    console.log('Host 3: amit@example.com / host123');
    console.log('Host 4: maria@example.com / host123');
    console.log('Host 5: sunil@example.com / host123');
    console.log('Host 6: vikram@example.com / host123');
    console.log('Host 7: anjali@example.com / host123');
    console.log('Host 8: karthik@example.com / host123');
    console.log('Host 9: suresh@example.com / host123');
    console.log('Traveler: sarah@example.com / traveler123');

    process.exit(0);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  }
};

seedDatabase();
