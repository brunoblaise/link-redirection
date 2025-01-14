import express, { Request } from 'express';
import { extractRequestInfo } from './middleware';
import { linkDefinitions, fallbackDefinition, LinkDefinition } from './link-definitions';
import { countryMapping } from './country-mapping';
import { logLinkClick } from './db';

const app = express();
const port = process.env.PORT || 3000;

// Add custom properties to the Request object
declare global {
	namespace Express {
		interface Request {
			country: string;
			videoId?: string;
		}
	}
}

app.use(extractRequestInfo);

app.get('/:slug', async (req: Request, res) => {
	const { slug } = req.params;
	const { country, videoId } = req;

	// Find the link definition
	const linkDefinition: LinkDefinition =
		linkDefinitions.find((def) => def.slug === slug) || fallbackDefinition;

	// Map the user's country to the appropriate Amazon store country
	const amazonCountry = countryMapping[country] || 'US';

	// Find the appropriate URL for the mapped Amazon store country or the default URL
	const redirectUrl = linkDefinition.links[amazonCountry] || linkDefinition.links['US'];

	// Log the link click to the Postgres database
	await logLinkClick(slug, country, linkDefinition.tags, redirectUrl, videoId);

	res.redirect(redirectUrl);
});

app.listen(port, () => {
	console.log(`Server started on port ${port}`);
});
