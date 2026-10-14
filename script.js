const products = [
	{
		id: "wavy-vase",
		name: "Wavy little vase",
		category: "Ceramics",
		price: 48,
		tag: "Small-batch",
		image: "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?auto=format&fit=crop&w=900&q=80",
		alt: "Handcrafted stoneware vessel in warm, natural clay"
	},
	{
		id: "weekday-lamp",
		name: "The weekday lamp",
		category: "Lighting",
		price: 128,
		tag: "A good glow",
		image: "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=900&q=80",
		alt: "Sculptural table lamp adding a soft, warm glow to a room"
	},
	{
		id: "sunday-throw",
		name: "Sunday somewhere throw",
		category: "Textiles",
		price: 86,
		tag: "Made to stay",
		image: "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=900&q=80",
		alt: "Quiet, natural textiles and comfortable furniture in a sunlit living room"
	},
	{
		id: "little-espresso-cup",
		name: "Little morning cup",
		category: "Ceramics",
		price: 32,
		tag: "Good mornings",
		image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=900&q=80",
		alt: "A handmade ceramic mug for a slow morning coffee"
	},
	{
		id: "slow-sunday-bowl",
		name: "Slow Sunday bowl",
		category: "Table",
		price: 42,
		tag: "Set the table",
		image: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=900&q=80",
		alt: "Thoughtfully shaped ceramic serving bowl in a warm neutral glaze"
	},
	{
		id: "good-day-vessel",
		name: "The good day vessel",
		category: "Table",
		price: 56,
		tag: "Maker's choice",
		image: "https://images.unsplash.com/photo-1493106641515-6b5631de4bb9?auto=format&fit=crop&w=900&q=80",
		alt: "Hand-thrown ceramic vessels, each with its own individual shape"
	}
];

const cartStorageKey = "fieldwork-cart-v1";
const favoritesStorageKey = "fieldwork-favorites-v1";
const freeShippingThreshold = 100;
const productGrid = document.querySelector("#product-grid");
const emptyState = document.querySelector("#empty-state");
const searchPanel = document.querySelector("#search-panel");
const searchInput = document.querySelector("#site-search");
const cartDrawer = document.querySelector("#cart-drawer");
const cartScrim = document.querySelector("#drawer-scrim");
const cartToggle = document.querySelector(".cart-toggle");
const savedToggle = document.querySelector(".saved-toggle");
const toastElement = document.querySelector("#toast");

function readStorage(key, fallback) {
	try {
		const value = localStorage.getItem(key);
		return value ? JSON.parse(value) : fallback;
	} catch {
		return fallback;
	}
}

let cart = readStorage(cartStorageKey, {});
let favorites = new Set(readStorage(favoritesStorageKey, []));
let activeCategory = "All";
let query = "";
let showFavoritesOnly = false;
let toastTimeout;

function saveState() {
	try {
		localStorage.setItem(cartStorageKey, JSON.stringify(cart));
		localStorage.setItem(favoritesStorageKey, JSON.stringify([...favorites]));
	} catch {
		showToast("Your browser could not save this just now.");
	}
}

function escapeHtml(value) {
	return String(value).replace(/[&<>"']/g, (character) => ({
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;"
	})[character]);
}

function renderProducts() {
	const normalizedQuery = query.trim().toLowerCase();
	const visibleProducts = products.filter((product) => {
		const matchesCategory = activeCategory === "All" || product.category === activeCategory;
		const matchesQuery = !normalizedQuery || `${product.name} ${product.category} ${product.tag}`.toLowerCase().includes(normalizedQuery);
		const matchesFavorites = !showFavoritesOnly || favorites.has(product.id);
		return matchesCategory && matchesQuery && matchesFavorites;
	});

	productGrid.innerHTML = visibleProducts.map((product, index) => `
		<article class="product-card" style="animation-delay: ${Math.min(index, 5) * 45}ms">
			<div class="product-image">
				<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.alt)}" loading="lazy">
				<span class="product-tag">${escapeHtml(product.tag)}</span>
				<button class="favorite-button" type="button" data-favorite="${escapeHtml(product.id)}" aria-label="${favorites.has(product.id) ? "Remove" : "Add"} ${escapeHtml(product.name)} ${favorites.has(product.id) ? "from" : "to"} favorites" aria-pressed="${favorites.has(product.id)}">
					<svg viewBox="0 0 24 24" fill="${favorites.has(product.id) ? "currentColor" : "none"}" aria-hidden="true"><path d="M20.8 8.8c0 4.2-8.8 10.1-8.8 10.1S3.2 13 3.2 8.8a4.6 4.6 0 0 1 8.8-1.9 4.6 4.6 0 0 1 8.8 1.9Z"></path></svg>
				</button>
			</div>
			<div class="product-details">
				<p class="product-category">${escapeHtml(product.category)}</p>
				<div class="product-meta"><h3 class="product-name">${escapeHtml(product.name)}</h3><span class="product-price">$${product.price.toFixed(2)}</span></div>
				<button class="product-add" type="button" data-add="${escapeHtml(product.id)}">Add to bag <span aria-hidden="true">+</span></button>
			</div>
		</article>
	`).join("");

	document.querySelector("#visible-count").textContent = String(visibleProducts.length);
	emptyState.hidden = visibleProducts.length !== 0;
	productGrid.hidden = visibleProducts.length === 0;
}

function updateCategoryButtons() {
	document.querySelectorAll(".category-button").forEach((button) => {
		const isActive = button.dataset.category === activeCategory;
		button.classList.toggle("is-active", isActive);
		button.setAttribute("aria-pressed", String(isActive));
	});
}

function updateHeaderCounts() {
	const itemCount = Object.values(cart).reduce((total, quantity) => total + quantity, 0);
	document.querySelector("#cart-count").textContent = String(itemCount);
	document.querySelector("#drawer-item-count").textContent = `(${itemCount})`;
	document.querySelector("#saved-count").textContent = String(favorites.size);
	savedToggle.setAttribute("aria-pressed", String(showFavoritesOnly));
}

function updateCart() {
	const entries = Object.entries(cart).filter(([id, quantity]) =>
		products.some((product) => product.id === id) && Number.isInteger(quantity) && quantity > 0
	);
	cart = Object.fromEntries(entries);
	const total = entries.reduce((sum, [id, quantity]) => {
		const product = products.find((item) => item.id === id);
		return sum + product.price * quantity;
	}, 0);

	document.querySelector("#cart-items").innerHTML = entries.map(([id, quantity]) => {
		const product = products.find((item) => item.id === id);
		return `
			<article class="cart-row">
				<img src="${escapeHtml(product.image)}" alt="" loading="lazy">
				<div class="cart-row-info">
					<h3>${escapeHtml(product.name)}</h3>
					<p>${escapeHtml(product.category)}</p>
					<div class="quantity-control" aria-label="Quantity for ${escapeHtml(product.name)}">
						<button type="button" data-quantity="${escapeHtml(id)}" data-change="-1" aria-label="Remove one ${escapeHtml(product.name)}">−</button>
						<span>${quantity}</span>
						<button type="button" data-quantity="${escapeHtml(id)}" data-change="1" aria-label="Add one ${escapeHtml(product.name)}">+</button>
					</div>
				</div>
				<span class="cart-row-price">$${(product.price * quantity).toFixed(2)}</span>
			</article>
		`;
	}).join("");

	const isEmpty = entries.length === 0;
	document.querySelector("#cart-empty").hidden = !isEmpty;
	document.querySelector("#drawer-footer").hidden = isEmpty;
	document.querySelector("#cart-subtotal").textContent = `$${total.toFixed(2)}`;
	document.querySelector("#shipping-note").textContent = total >= freeShippingThreshold
		? "Lovely news, your shipping is on us."
		: `You're $${(freeShippingThreshold - total).toFixed(2)} away from complimentary shipping.`;
	updateHeaderCounts();
}

function showToast(message) {
	window.clearTimeout(toastTimeout);
	toastElement.textContent = message;
	toastElement.classList.add("is-visible");
	toastTimeout = window.setTimeout(() => toastElement.classList.remove("is-visible"), 2600);
}

function addToCart(id) {
	const product = products.find((item) => item.id === id);
	if (!product) return;
	cart[id] = (cart[id] || 0) + 1;
	saveState();
	updateCart();
	showToast(`${product.name} is tucked in your bag.`);
}

function toggleFavorite(id) {
	const product = products.find((item) => item.id === id);
	if (!product) return;
	if (favorites.has(id)) {
		favorites.delete(id);
		showToast(`${product.name} removed from saved favorites.`);
	} else {
		favorites.add(id);
		showToast(`${product.name} saved for later.`);
	}
	saveState();
	updateHeaderCounts();
	renderProducts();
}

function openCart() {
	cartScrim.hidden = false;
	cartDrawer.inert = false;
	cartDrawer.setAttribute("aria-hidden", "false");
	cartDrawer.classList.add("is-open");
	cartToggle.setAttribute("aria-expanded", "true");
	document.body.style.overflow = "hidden";
	document.querySelector(".drawer-close").focus();
}

function closeCart() {
	cartDrawer.classList.remove("is-open");
	cartDrawer.inert = true;
	cartDrawer.setAttribute("aria-hidden", "true");
	cartScrim.hidden = true;
	cartToggle.setAttribute("aria-expanded", "false");
	document.body.style.overflow = "";
	cartToggle.focus();
}

function closeSearch() {
	searchPanel.hidden = true;
	document.querySelector(".search-toggle").setAttribute("aria-expanded", "false");
}

document.querySelector(".search-toggle").addEventListener("click", () => {
	searchPanel.hidden = !searchPanel.hidden;
	document.querySelector(".search-toggle").setAttribute("aria-expanded", String(!searchPanel.hidden));
	if (!searchPanel.hidden) searchInput.focus();
});

document.querySelector(".search-close").addEventListener("click", closeSearch);
searchInput.addEventListener("input", (event) => {
	query = event.currentTarget.value;
	renderProducts();
	document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector(".search-form").addEventListener("submit", (event) => event.preventDefault());

document.querySelectorAll(".category-button").forEach((button) => {
	button.addEventListener("click", () => {
		activeCategory = button.dataset.category;
		showFavoritesOnly = false;
		query = "";
		searchInput.value = "";
		updateCategoryButtons();
		updateHeaderCounts();
		renderProducts();
	});
});

document.querySelector(".primary-nav [data-nav-category]").addEventListener("click", () => {
	activeCategory = "Table";
	showFavoritesOnly = false;
	updateCategoryButtons();
	updateHeaderCounts();
	renderProducts();
});

savedToggle.addEventListener("click", () => {
	showFavoritesOnly = !showFavoritesOnly;
	activeCategory = "All";
	updateCategoryButtons();
	updateHeaderCounts();
	renderProducts();
	document.querySelector("#shop").scrollIntoView({ behavior: "smooth", block: "start" });
});

productGrid.addEventListener("click", (event) => {
	const addButton = event.target.closest("[data-add]");
	const favoriteButton = event.target.closest("[data-favorite]");
	if (addButton) addToCart(addButton.dataset.add);
	if (favoriteButton) toggleFavorite(favoriteButton.dataset.favorite);
});

cartToggle.addEventListener("click", openCart);
document.querySelector(".drawer-close").addEventListener("click", closeCart);
cartScrim.addEventListener("click", closeCart);

document.querySelector("#cart-items").addEventListener("click", (event) => {
	const button = event.target.closest("[data-quantity]");
	if (!button) return;
	const { quantity: id, change } = button.dataset;
	cart[id] = (cart[id] || 0) + Number(change);
	if (cart[id] <= 0) delete cart[id];
	saveState();
	updateCart();
});

document.querySelector(".cart-continue").addEventListener("click", closeCart);
document.querySelector(".checkout-button").addEventListener("click", () => {
	showToast("Checkout is ready to connect to your payment provider.");
});

document.querySelector(".newsletter-form").addEventListener("submit", (event) => {
	event.preventDefault();
	const email = new FormData(event.currentTarget).get("email");
	document.querySelector("#newsletter-message").textContent = `You're on the list. Look out for a nice note at ${email}.`;
	event.currentTarget.reset();
});

document.addEventListener("keydown", (event) => {
	if (event.key === "Escape") {
		if (cartDrawer.classList.contains("is-open")) closeCart();
		else if (!searchPanel.hidden) closeSearch();
	}
});

renderProducts();
updateCart();
