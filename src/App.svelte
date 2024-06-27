<script>
	import Navbar from "./components/Navbar.svelte";
	import Footer from "./components/Footer.svelte";
	import Header from "./components/Header.svelte";
	import About from "./components/About.svelte";
	import Projects from "./components/Projects.svelte";
	import Contact from "./components/Contact.svelte";
	import { onMount } from "svelte";

	let brand = "sputnix.me";
	let nav_items = [
		["Home", "#"],
		["About", "#about"],
		["Projects", "#projects"],
		["Contact", "#contact"],
	];
	let github = "https://github.com/Gitkubikon";

	let header_title_1 = "Hello,";
	let header_title_2 = "I'm {Nikita}";
	let header_title_3 = [
		"UI Designer.",
		"Web Developer.",
		"Freelancer.",
		"Genius",
		"Billionaire *",
		"Playboy",
		"Philanthropist",
		"Team Lead",
	];

	let bio_title = "About Me";
	let skills_title = "My Skills";
	let skills = {
		Languages: [
			["Python", "fab fa-python", 60],
			["Shell Script", "fab fa-linux", 75],
			["HTML/CSS", "fab fa-html5", 90],
			["JavaScript", "fab fa-js-square", 85],
			["TypeScript", "fab fa-js", 90],
		],

		Tools: [
			["Adobe Photoshop", "fas fa-image", 85],
			["Adobe Illustrator", "fas fa-pencil-alt", 80],
			["Figma", "fas fa-object-group", 75],
			["InDesign", "fas fa-file-alt", 70],
			["Blender", "fas fa-blender", 30],
		],
		LanguagesSpoken: [
			["German (Native)", "fas fa-language", 100],
			["Russian (Native)", "fas fa-language", 100],
			["English (C1)", "fas fa-language", 90],
			["Japanese (Basic)", "fas fa-language", 30],
		],
		AI: [
			["Midjourney", "fas fa-robot", 70],
			["ChatGPT", "fas fa-comments", 75],
		],
		Frameworks: [
			["Svelte", "fas fa-code", 95],
			["Flutter", "fab fa-dev", 50],

		],
	};
	let bio = `
	  I am Nikita Friesen, a dedicated and passionate software engineer currently pursuing a Bachelor of Science in User Experience Design at the Technical University Ingolstadt. 
	  My journey in technology has been both diverse and fulfilling, encompassing various roles and responsibilities. I have honed my skills in user research, design thinking, and prototyping through rigorous academic training and practical experience.
	  
	  I've had the opportunity to work with leading companies such as SodaStream and HIVE Systems, where I contributed to the development of advanced systems and interfaces. My experience ranges from sales and merchandising to software engineering and digital art freelancing. 
	  
	  Beyond my technical expertise, I have a strong foundation in graphic design, with advanced skills in Adobe Photoshop, Illustrator, Figma, and InDesign. My multilingual abilities in German, Russian, English, and Japanese allow me to communicate and collaborate effectively in diverse environments.
	  
	  I aim to leverage my skills and experience to create impactful solutions and contribute to the advancement of technology.`;

	let projects_title = "Project Showcase";
	let projects = [
		[
			"HIVE Dashboard",
			"Led the development of the HIVE Dashboard’s frontend, a sophisticated management interface for drone fleet operations. Implemented features for monitoring drone status, performance, and location, enhancing operational efficiency.",
			"#",
		],
		[
			"Twitch Channel Designs",
			"Created compelling logo and illustration designs for Twitch channels, increasing viewer engagement and channel identity. These designs significantly contributed to the channels' visual appeal and brand identity.",
			"#",
		],
		[
			"Gabrieli-Gymnasium Brand Identity",
			"Designed logos and school clothing for Gabrieli-Gymnasium, significantly enhancing the school’s brand identity. This project was a perfect blend of creativity and practicality, resulting in a more cohesive and recognizable brand.",
			"https://www.gabrieli-gymnasium.de/menschen/schuelervertretung/schulkleidung/",
		],
		[
			"Software Development at IDL",
			"Gained deep insights into company operations and contributed to programming minor bugs and features. Participated in regular team meetings, enhancing collaboration and problem-solving skills.",
			"#",
		],
	];

	let contact_title = "Contact Me";
	let social = [
		[
			"LinkedIn",
			"fab fa-linkedin",
			"https://www.linkedin.com/in/nikita-friesen",
		],
		["Email", "fas fa-envelope", "mailto:nikitafriesen74@gmail.com"],
		//   ["Twitter", "fab fa-twitter", "#"],
		//   ["YouTube", "fab fa-youtube", "#"],
		["Github", "fab fa-github", github],
	];

	let state = "dark"; // Change this to "light" to use light theme.

	let text_color = "dark";
	let bg_color = "light";

	if (state === "dark") {
		text_color = "light";
		bg_color = "dark";
	}

	onMount(() => {
		const sections = document.querySelectorAll("section");

		const observer = new IntersectionObserver((entries) => {
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					entry.target.classList.add("visible");
				} else {
					entry.target.classList.remove("visible");
				}
			});
		});

		sections.forEach((section) => {
			observer.observe(section);
		});
	});
</script>

<main class="bg-{bg_color} text-{text_color} min-vh-100">
	<div class="bg-pattern">
		<Navbar Id="navbar" {brand} {nav_items} {github} {state} />
		<Header
			Id="#"
			{header_title_1}
			{header_title_2}
			{header_title_3}
			{state}
		/>
		<About Id="about" {bio_title} {bio} {skills_title} {skills} {state} />
		<Projects Id="projects" {projects_title} {projects} {state} />
		<Contact Id="contact" {contact_title} {social} {state} />
		<Footer Id="footer" {brand} {state} />
	</div>
</main>

<style>
	html {
		scroll-behavior: smooth;
	}

	section {
		opacity: 0;
		transition: opacity 0.5s ease-in-out;
	}

	section.visible {
		opacity: 1;
	}
</style>
