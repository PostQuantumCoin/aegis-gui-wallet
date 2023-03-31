const smHeight = 360;
const mdHeight = 480;
const lgHeight = 600;
const xlHeight = 1024;

function containerTweakSm(offset) {
	return {
		height: offset ? `${smHeight - offset}px` : `${smHeight}px`
	}
}
function containerTweakMd(offset) {
	return {
		height: offset ? `${mdHeight - offset}px` : `${mdHeight}px`
	}
}
function containerTweakLg(offset) {
	return {
		height: offset ? `${lgHeight - offset}px` : `${lgHeight}px`
	}
}
function containerTweakXl(offset) {
	return {
		height: offset ? `${xlHeight - offset}px` : `${xlHeight}px`
	}
}

const containerSm = {
	height: smHeight,
	tweak: containerTweakSm
};
const containerMd = {
	height: mdHeight,
	tweak: containerTweakMd
};
const containerLg = {
	height: lgHeight,
	tweak: containerTweakLg
};
const containerXl = {
	height: xlHeight,
	tweak: containerTweakXl
};

export {
	containerSm, containerMd, containerLg, containerXl
};
