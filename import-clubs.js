const fs = require('fs');
const crypto = require('crypto');

// Read the CSV file
const csvContent = fs.readFileSync('district1clubs.csv', 'utf8');
const lines = csvContent.trim().split('\n');

// Skip header row
const dataLines = lines.slice(1);

// Parse CSV data
const clubs = dataLines.map(line => {
  const [province, district, zone, city, clubName, type] = line.split(',');
  return {
    province: province.trim(),
    district: district.trim(),
    zone: zone.trim(),
    city: city.trim(),
    clubName: clubName.trim(),
    type: type.trim()
  };
});

// Generate UUIDs for districts, zones, and clubs
const districts = [...new Set(clubs.map(c => c.district))];
const zones = [...new Set(clubs.map(c => `${c.district}-${c.zone}`))];

// Create mapping for consistent UUIDs
const districtIds = {};
const zoneIds = {};
const clubIds = {};

districts.forEach(district => {
  districtIds[district] = crypto.randomUUID();
});

zones.forEach(zone => {
  zoneIds[zone] = crypto.randomUUID();
});

clubs.forEach(club => {
  clubIds[club.clubName] = crypto.randomUUID();
});

// Generate SQL
let sql = `-- Kin Canada Clubs Complete Import Script
-- Generated from district1clubs.csv

-- Clear existing data
DELETE FROM clubs;
DELETE FROM zones;
DELETE FROM districts;

-- Insert districts
`;

districts.forEach(district => {
  sql += `INSERT INTO districts (id, name, province) VALUES ('${districtIds[district]}', '${district}', 'Ontario');\n`;
});

sql += `\n-- Insert zones\n`;

zones.forEach(zone => {
  const [district, zoneName] = zone.split('-');
  sql += `INSERT INTO zones (id, name, district_id, zone_letter) VALUES ('${zoneIds[zone]}', '${zoneName}', '${districtIds[district]}', '${zoneName.split(' ')[1]}');\n`;
});

sql += `\n-- Insert clubs\n`;

clubs.forEach(club => {
  const zoneKey = `${club.district}-${club.zone}`;
  sql += `INSERT INTO clubs (id, name, city, club_type, zone_id, district_id) VALUES ('${clubIds[club.clubName]}', '${club.clubName.replace(/'/g, "''")}', '${club.city.replace(/'/g, "''")}', '${club.type}', '${zoneIds[zoneKey]}', '${districtIds[club.district]}');\n`;
});

// Write to file
fs.writeFileSync('supabase-complete-clubs-import.sql', sql);

console.log(`Generated SQL import script with:`);
console.log(`- ${districts.length} districts`);
console.log(`- ${zones.length} zones`);
console.log(`- ${clubs.length} clubs`);
console.log(`\nFile saved as: supabase-complete-clubs-import.sql`);
