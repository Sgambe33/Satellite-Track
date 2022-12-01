# Satellite-Track 
NodeJs project to track and map all currently active satellites orbiting Earth.
The website is capable of tracking one among all active satellites by displaying its previous, current and next orbit. It also allows the user to geolocalize himself to determine if he is in the view radius represented by a white circle.
## Libraries used
- [Leaflet]("https://leafletjs.com/"): popular library providing web mapping capabilities.

- [tle.js](https://github.com/davidcalhoun/tle.js/): implemented for orbit prediction and satellite's avionics data such as speed and altitude.

- [Leaflet.Dialog](https://github.com/NBTSolutions/Leaflet.Dialog): used to display avionics data to the user.

- [sidebar-v2](https://github.com/Turbo87/sidebar-v2): provides a clean sidebar to interact with.

## APIs used

-[space-trak.org]("https://www.space-track.org/#queryBuilder") for satcat database creation.

-[celestrak.org]("https://celestrak.org/") for TLEs fetching.
