const animatedLoadingCnt = document.getElementById(`loading-cnt`);

window.addEventListener(`load`, () => toggleLoadingVisibility(false));


function toggleLoadingVisibility(visible = true) {
	if (visible) {
		return animatedLoadingCnt.classList.remove(`!hidden`);
	}
	animatedLoadingCnt.classList.add(`!hidden`);
}