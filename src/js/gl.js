const sizeof_f32 = 4;
const sizeof_obj = 52 * sizeof_f32;
function gl_create_obj(memory, index) {
	let data = {
		position: new Float32Array(memory, index + 0 * sizeof_f32, 4),
		rotation: new Float32Array(memory, index + 4 * sizeof_f32, 4),
		color:    new Float32Array(memory, index + 8 * sizeof_f32, 4),
		emission: new Float32Array(memory, index + 12 * sizeof_f32, 4),
		shade0:   new Float32Array(memory, index + 16 * sizeof_f32, 4),
		model:    new Float32Array(memory, index + 20 * sizeof_f32, 16),
		mvp:      new Float32Array(memory, index + 36 * sizeof_f32, 16),
	};

	data.position.set([0, 0, 0, 1]);
	data.rotation.set([0, 0, 0, 1]);
	data.color.set([1, 1, 1, 1]);
	data.emission.set([0, 0, 0, 0]);
	data.shade0.set([0, 0, 0, 0]);
	data.model.set([
		1, 0, 0, 0,
		0, 1, 0, 0,
		0, 0, 1, 0,
		0, 0, 0, 1,
	]);
	return data;
}

function gl_draw_obj(gl, state, object, model, parent, shader, tmp0) {
	if (parent) {
		RT(tmp0, object.rotation, object.position);
		mul4x4(object.model, parent, tmp0);
	} else { 
		RT(object.model, object.rotation, object.position);
	}
	mul4x4(object.mvp, state.camera_vp, object.model);
	
	gl.uniformMatrix4fv(shader.u_model, false, object.model);
	gl.uniformMatrix4fv(shader.u_mvp, false, object.mvp);
	gl.uniform4fv(shader.u_color, object.color);
	gl.uniform4fv(shader.u_settings0, object.shade0);
	gl.uniform4fv(shader.u_emission, object.emission);
	
	// Draw
	gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices);
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices);
	gl.vertexAttribPointer(shader.a_position, 3, gl.FLOAT, false, 64, 0);
	gl.vertexAttribPointer(shader.a_normal, 3, gl.FLOAT, false, 64, 12);
	gl.vertexAttribPointer(shader.a_tangent, 4, gl.FLOAT, false, 64, 24);
	gl.vertexAttribPointer(shader.a_texcoord, 2, gl.FLOAT, false, 64, 40);
	gl.vertexAttribPointer(shader.a_color, 4, gl.FLOAT, false, 64, 48);
	gl.drawElements(gl.TRIANGLES, model.index_count, gl.UNSIGNED_SHORT, model.indices);

	
}

function gl_parse_model(gl, state, model, name) {
	let vertex_data = Base64ToUint8(model.vertices);
	let vertex_view = new DataView(vertex_data.buffer);
	let vertex_count = vertex_data.length / 28;
	let vertices = new Float32Array(vertex_count * 16);
	for (let i = 0; i < vertex_count; i++) {
		let vi = i * 16; let di = i * 28;
		vertices[vi + 0] = vertex_view.getFloat32(di + 0, false);
		vertices[vi + 1] = vertex_view.getFloat32(di + 4, false);
		vertices[vi + 2] = vertex_view.getFloat32(di + 8, false);

		let n_xy = vertex_view.getUint16(di + 12, false);
		let n_z  = vertex_view.getUint16(di + 14, false);
		let _n_x = (n_xy>>1&16383) / 16383;
		if ((n_xy & 32768) !== 0) _n_x = -_n_x;
		let _n_z = (n_z & 32767) / 32767;
		if ((n_z & 32768) !== 0) _n_z = -_n_z;
		let _n_y = Math.sqrt(1-(_n_x*_n_x+_n_z*_n_z));
		if ((n_xy & 1) !== 0) _n_y = -_n_y;
		vertices[vi + 3] = _n_x;
		vertices[vi + 4] = _n_y;
		vertices[vi + 5] = _n_z;

		let t_xy = vertex_view.getUint16(di + 16, false);
		let t_zw = vertex_view.getUint16(di + 18, false);
		let _t_x = ((t_xy>>1)&16383) / 16383;
		if ((t_xy & 32768) !== 0) _t_x = -_t_x;
		let _t_z = ((t_zw>>1)&16383) / 16383;
		if ((t_zw & 32768) !== 0) _t_z = -_t_z;
		let _t_w = (t_zw & 1) === 0 ? 1 : -1;
		let _t_y = Math.sqrt(1-(_t_x*_t_x+_t_z*_t_z));
		if ((t_xy & 1) !== 0) _t_y = -_t_y;
		vertices[vi + 6] = _t_x;
		vertices[vi + 7] = _t_y;
		vertices[vi + 8] = _t_z;
		vertices[vi + 9] = _t_w;

		let u = vertex_view.getUint16(di + 20, false);
		let _u = (u & 32767) / 32767;
		if ((u&32768)!==0) _u = -_u;
		let v = vertex_view.getUint16(di + 22, false);
		let _v = (v & 32767) / 32767;
		if ((v&32768)!==0) _v = -_v;

		vertices[vi + 10] = _u;
		vertices[vi + 11] = _v;
		vertices[vi + 12] = vertex_view.getUint8(di + 24, false) / 255;
		vertices[vi + 13] = vertex_view.getUint8(di + 25, false) / 255;
		vertices[vi + 14] = vertex_view.getUint8(di + 26, false) / 255;
		vertices[vi + 15] = vertex_view.getUint8(di + 27, false) / 255;
	}
	let vertex_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
	gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

	let index_data = Base64ToUint8(model.indices);
	let len = index_data.length / 2;
	if (len != Math.round(len)) console.error("Incorrect size: " + len);
	let indices = new Uint16Array(len);
	let index_view = new DataView(index_data.buffer);
	for (var i = 0; i < len; i++)
		indices[i] = index_view.getUint16(i * 2, false);
	let index_buffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

	console.log(name+" is added to models!");
	state.models[name] = {
		vertices: vertex_buffer,
		indices: index_buffer,
		index_count: model.index_count
	}
}

function gl_create_program(gl, vert_id, frag_id) {
	let vert = gl.createShader(gl.VERTEX_SHADER);
	gl.shaderSource(vert, document.getElementById(vert_id).innerHTML);
	gl.compileShader(vert);
	if (!gl.getShaderParameter(vert, gl.COMPILE_STATUS)) {
		alert('[VERT] An error occurred compiling '+vert_id+': '+gl.getShaderInfoLog(vert));
		gl.deleteShader(vert);
	}
	
	let frag = gl.createShader(gl.FRAGMENT_SHADER);
	gl.shaderSource(frag, document.getElementById(frag_id).innerHTML);
	gl.compileShader(frag);
	if (!gl.getShaderParameter(frag, gl.COMPILE_STATUS)) {
		alert('[FRAG] An error occurred compiling the '+frag_id+': '+gl.getShaderInfoLog(frag));
		gl.deleteShader(frag);
	}
	
	var program = gl.createProgram();
	gl.attachShader(program, vert);
	gl.attachShader(program, frag);
	gl.linkProgram(program);
	gl.useProgram(program);
	return program;
}

function gl_create_texture_color(gl, r, g, b, a) {
	let tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([r, g, b, a]));
	return tex;
}

function gl_onresize(gl, canvas, state, e) {
	let width = canvas.innerWidth || canvas.clientWidth;
	let height = canvas.innerHeight || canvas.clientHeight;
	canvas.setAttribute("height", height);
	canvas.setAttribute("width", width);
	gl.viewport(0, 0, width, height);
	state.screen.width = width;
	state.screen.height = height;
	state.screen.aspect = width / height;
	state.screen.window_width = window.innerWidth;
	state.screen.window_height = window.innerHeight;
	state.screen.window_aspect = state.screen.window_width / state.screen.window_height;
}

function gl_refresh_viewport(gl, canvas) {
	let width = canvas.innerWidth || canvas.clientWidth;
	let height = canvas.innerHeight || canvas.clientHeight;
	gl.viewport(0, 0, width, height);
}

function memory_counter(element_size) {
	let state = {
		index: 0,
	};
	state.inc = function(value) {
		state.index += value * element_size;
		return value;
	};
	return state;
}

function checkGLErrors(gl) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error('WebGL error:', error);
    }
}
function generate_blend_texture(gl, state, width, height) {
	let buf = gl.createFramebuffer();
	gl.bindFramebuffer(gl.FRAMEBUFFER, buf);
	
	let tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
	
	gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
	if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
		console.error("Framebuffer is not complete");
	}
	
	let result = {
		texture: tex,
		buffer: buf,
	};
	
	result.update = function(texture_0, texture_1, noise, alpha, offset_x, offset_y) {
		gl.bindFramebuffer(gl.FRAMEBUFFER, result.buffer);
		gl.viewport(0, 0, width, height);
		gl.clear(gl.COLOR_BUFFER_BIT);
		gl.clearColor(0.0, 0.0, 0.0, 1.0);
		
		let shader = state.shaders["mixer"];
		gl.useProgram(shader.program);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, texture_0);
		gl.uniform1i(shader.u_texture_0, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, texture_1);
		gl.uniform1i(shader.u_texture_1, 1);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, noise);
		gl.uniform1i(shader.u_noise_tex, 2);
		gl.uniform3f(shader.u_settings0, alpha, offset_x, offset_y);
		
		let model = state.models["quad"];
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices);
		gl.enableVertexAttribArray(shader.a_position);
		gl.vertexAttribPointer(shader.a_position, 2, gl.FLOAT, false, 0, 0);
		
		gl.bindBuffer(gl.ARRAY_BUFFER, model.uvs);
		gl.enableVertexAttribArray(shader.a_texcoord);
		gl.vertexAttribPointer(shader.a_texcoord, 2, gl.FLOAT, false, 0, 0);
		
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	}
	
	checkGLErrors(gl);
	return result;
}

function gl_load_texture(gl, state, key, data) {
	let variants = data.variants;
	for (let variant_key in variants) {
		if (variants.hasOwnProperty(variant_key)) {
			let variant = variants[variant_key];
			let name = variant_key ? key + "_" + variant_key : key;
			let image = new Image();
			image.onload = function() {
				let texture = gl.createTexture();
				gl.bindTexture(gl.TEXTURE_2D, texture);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl[data.TEXTURE_MIN_FILTER]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl[data.TEXTURE_MAG_FILTER]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl[data.TEXTURE_WRAP_S]);
				gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl[data.TEXTURE_WRAP_T]);
				gl.texImage2D(gl.TEXTURE_2D, 0, gl[variant.internal_format], gl[variant.format], gl[variant.type], image);
				checkGLErrors(gl);
				console.log(name + ": texture loaded");
				state.textures[name] = texture;
			}
			image.src = variant.src;
			
			console.log(name, variant);
			//console.log( data.TEXTURE_MIN_FILTER,  data.TEXTURE_MAG_FILTER, data.TEXTURE_WRAP_S, data.TEXTURE_WRAP_T);
			//console.log( gl[data.TEXTURE_MIN_FILTER],  gl[data.TEXTURE_MAG_FILTER], gl[data.TEXTURE_WRAP_S], gl[data.TEXTURE_WRAP_T]);
			//console.log( variant.internal_format,  variant.format, variant.type);
			//console.log( gl[variant.internal_format],  gl[variant.format], gl[variant.type]);
			//
		}
	}
}

function gl_init(gl, canvas) {
	gl.enable(gl.DEPTH_TEST);
	gl.activeTexture(gl.TEXTURE0);
	let bi = memory_counter(4);
	var memory = new ArrayBuffer(4096);
	var state = {
		camera_position: new Float32Array(memory, bi.index, bi.inc(3)),
		camera_rotation: new Float32Array(memory, bi.index, bi.inc(4)),
		camera_vp:       new Float32Array(memory, bi.index, bi.inc(16)),
		camera_to_world: new Float32Array(memory, bi.index, bi.inc(16)),
		world_to_camera: new Float32Array(memory, bi.index, bi.inc(16)),
		sun_color:       new Float32Array(memory, bi.index, bi.inc(3)),
		sun_direction:   new Float32Array(memory, bi.index, bi.inc(3)),
		light_position:  new Float32Array(memory, bi.index, bi.inc(3)),
		light_angle:     new Float32Array(memory, bi.index, bi.inc(3)),
		point_light_pos0:new Float32Array(memory, bi.index +  0, 3),
		point_light_pos1:new Float32Array(memory, bi.index + 12, 3),
		point_light_pos2:new Float32Array(memory, bi.index + 24, 3),
		point_lights_pos:new Float32Array(memory, bi.index, bi.inc(9)),
		point_lights_str:new Float32Array(memory, bi.index, bi.inc(3)),
		tmp0:            new Float32Array(memory, bi.index, bi.inc(16)),
		tmp1:            new Float32Array(memory, bi.index, bi.inc(16)),
		tmp2:            new Float32Array(memory, bi.index, bi.inc(16)),
		save_data: { },
		update_data: { },
		keys: {},
		objects: {
			sky:             gl_create_obj(memory, bi.index + sizeof_obj *  0),
			tl_back:         gl_create_obj(memory, bi.index + sizeof_obj *  1),
			tl_rim:          gl_create_obj(memory, bi.index + sizeof_obj *  2),
			tl_red_back:     gl_create_obj(memory, bi.index + sizeof_obj *  3),
			tl_red_cap:      gl_create_obj(memory, bi.index + sizeof_obj *  4),
			tl_red_light:    gl_create_obj(memory, bi.index + sizeof_obj *  5),
			tl_orange_back:  gl_create_obj(memory, bi.index + sizeof_obj *  6),
			tl_orange_cap:   gl_create_obj(memory, bi.index + sizeof_obj *  7),
			tl_orange_light: gl_create_obj(memory, bi.index + sizeof_obj *  8),
			tl_green_back:   gl_create_obj(memory, bi.index + sizeof_obj *  9),
			tl_green_cap:    gl_create_obj(memory, bi.index + sizeof_obj * 10),
			tl_green_light:  gl_create_obj(memory, bi.index + sizeof_obj * 11),
			tl_pole_black:   gl_create_obj(memory, bi.index + sizeof_obj * 12),
			tl_pole_white:   gl_create_obj(memory, bi.index + sizeof_obj * 13),
			tl_ground:   gl_create_obj(memory, bi.index + sizeof_obj * 14),
		},
		models: {},
		textures: {},
		shaders: {},
		screen: {},
		loading: {
			assets: { name:"Asset File", what: "Downloading..", progress: 0 },
		},
		light_scale_alpha: 0.0,
	};
	
	// Load save data
	{
		let sd = JSON.parse(localStorage.getItem("data") || "{}");
		state.save_data.zoom = sd.zoom || 1.0;
		state.save_data.camera_angle_x = sd.camera_angle_x || 0.0;
		state.save_data.camera_angle_y = sd.camera_angle_y || 0.0;
		state.save_data.red = true;
		state.save_data.orange = true;
		state.save_data.green = true;
		state.save_data.sky_tex = sd.sky_tex || "valley"; // (is like a queue)
		state.save = function() {
			localStorage.setItem("data", JSON.stringify(state.save_data));
		};
	}
	
	// Initialize update data
	{
		state.update_data.zoom = follower(0.2, false, state.save_data.zoom);
		state.update_data.camera_angle_x = follower(0.06, true, state.save_data.camera_angle_x);
		state.update_data.camera_angle_y = follower(0.06, true, state.save_data.camera_angle_y);
		
		state.update_data.red = follower(0.04, false, +state.save_data.red);
		state.update_data.orange = follower(0.04, false, +state.save_data.orange);
		state.update_data.green = follower(0.04, false, +state.save_data.green);
		
		state.update_data.sky_tex_current = state.save_data.sky_tex;
		state.update_data.sky_tex_target = state.save_data.sky_tex;
		state.update_data.sky_tex_alpha = 0;
		
		state.update_data.show_light = true;
		state.update_data.show_pole = true;
		state.update_data.queue_screenshot = false;
		state.update_data.white_noise = false;
	}
	
	let color_ground = [0.47, 0.46, 0.42];
	let color_black = [0.18, 0.18, 0.18];
	let color_white = [1, 1, 1];
	let color_red = [0.95, 0.06, 0.11];
	let color_orange = [0.92, 0.66, 0.12];
	let color_green = [0.45, 0.90, 0.77];
	
	let shade_ground = [0, 1, 0.5, 0];
	let shade_pole_w = [0, 0.3, 0.5, 0.0];
	let shade_pole_b = [0, 0.6, 0.5, 0];
	let shade_board = [0, 0.9, 0.5, 0.0];
	let shade_trim = [0, 0.6, 0.5, 0.0];
	let shade_light = [0, 0.2, 0.5, 0];
	
	state.camera_position.set([0, 0, -1]);
	state.objects.tl_back.color.set(color_black);
	state.objects.tl_back.shade0.set(shade_board);
	state.objects.tl_back.position.set([0, 0.0, -0.016]);
	state.objects.tl_rim.color.set(color_white);
	state.objects.tl_rim.shade0.set(shade_trim);
	state.objects.tl_rim.position.set([0, 0.0, -0.016]);
	
	state.objects.tl_red_back.color.set(color_black);
	state.objects.tl_red_back.shade0.set(shade_board);
	state.objects.tl_red_back.position.set([0, 0.2, 0]);
	state.objects.tl_red_cap.color.set(color_black);
	state.objects.tl_red_cap.shade0.set(shade_board);
	state.objects.tl_red_cap.position.set([0, 0.2, 0]);
	state.objects.tl_red_light.color.set(color_red);
	state.objects.tl_red_light.position.set([0, 0.2, 0]);
	state.objects.tl_red_cap.shade0.set(shade_light);
	
	state.objects.tl_orange_back.color.set(color_black);
	state.objects.tl_orange_back.shade0.set(shade_board);
	state.objects.tl_orange_cap.color.set(color_black);
	state.objects.tl_orange_cap.shade0.set(shade_board);
	state.objects.tl_orange_light.color.set(color_orange);
	state.objects.tl_orange_light.shade0.set(shade_light);
	
	state.objects.tl_green_back.color.set(color_black);
	state.objects.tl_green_back.shade0.set(shade_board);
	state.objects.tl_green_back.position.set([0, -0.2, 0]);
	state.objects.tl_green_cap.color.set(color_black);
	state.objects.tl_green_cap.shade0.set(shade_board);
	state.objects.tl_green_cap.position.set([0, -0.2, 0]);
	state.objects.tl_green_light.color.set(color_green);
	state.objects.tl_green_light.position.set([0, -0.2, 0]);
	state.objects.tl_green_light.shade0.set(shade_light);
	
	state.objects.tl_pole_black.color.set(color_black);
	state.objects.tl_pole_black.shade0.set(shade_pole_b);
	state.objects.tl_pole_black.position.set([0, 0.0, -0.016]);
	state.objects.tl_pole_white.color.set(color_white);
	state.objects.tl_pole_white.shade0.set(shade_pole_w);
	state.objects.tl_pole_white.position.set([0, 0.0, -0.016]);
	state.objects.tl_ground.color.set(color_ground);
	state.objects.tl_ground.shade0.set(shade_ground);
	state.objects.tl_ground.position.set([0, 0.0, -0.016]);

	addEvent(window, "resize", function(e) {
		gl_onresize(gl, canvas, state, e);
	}); gl_onresize(gl, canvas, state, null);
	
	addEvent(window, "wheel", function(e) {
		//e.preventDefault();
		state.save_data.zoom += e.deltaY * 0.002;
		state.save_data.zoom = Math.min(Math.max(0, state.save_data.zoom), 1);
		state.save();
	}, { passive: true });
	
	addEvent(window, "keyup", function(e) {
		state.keys[e.keyCode] = false;
		//e.preventDefault();
	}, { passive: true });
	
	addEvent(window, "keydown", function(e) {
		state.keys[e.keyCode] = true;
		console.log(e.keyCode)
		if (e.keyCode == 81 /*q*/) {
			state.update_data.queue_screenshot = true;
		} else if (e.keyCode == 87 /*w*/) {
			state.update_data.show_light ^= true;
		} else if (e.keyCode == 69 /*e*/) {
			state.update_data.show_pole ^= true;
		} else if (e.keyCode == 82 /*r*/) {
			state.update_data.white_noise ^= true;
		}
		
		//e.preventDefault();
	}, { passive: true });
	
	// Mouse drag
	{
		let drag_mouse_x, drag_mouse_y;
		let drag_cancel = function() {
			drag_mouse_x = null;
			drag_mouse_y = null;
			state.save();
		};
		addEvent(canvas, "mousedown", function(e) {
			if (e.button == 0) {
				drag_mouse_x = e.clientX / state.screen.width;
				drag_mouse_y = e.clientY / state.screen.height;
			} else {
				drag_cancel();
			}
		});
		addEvent(window, "mousemove", function(e) {
			if (drag_mouse_x != null && drag_mouse_y != null) {
				let x = e.clientX / state.screen.width;
				let y = e.clientY / state.screen.height;
				state.save_data.camera_angle_x += (x - drag_mouse_x) * 3;
				state.save_data.camera_angle_y += (y - drag_mouse_y) * 3;
				drag_mouse_x = x;
				drag_mouse_y = y;
			}
		});
		addEvent(canvas, "touchstart", function(e) {
			if (e.touches.length === 1) {
				isDragging = true;
				drag_mouse_x = e.touches[0].clientX / state.screen.width;
				drag_mouse_y = e.touches[0].clientY / state.screen.height;
			} else {
				drag_cancel();
			}
		});
		addEvent(window, "touchmove", function(e) {
			if (drag_mouse_x != null && drag_mouse_y != null && e.touches.length === 1) {  // Ensure only one finger is used
				const x = e.touches[0].clientX / state.screen.width;
				const y = e.touches[0].clientY / state.screen.height;
				state.save_data.camera_angle_x += (x - drag_mouse_x) * 3;
				state.save_data.camera_angle_y += (y - drag_mouse_y) * 3;
				drag_mouse_x = x;
				drag_mouse_y = y;
			}
		});
		addEvent(window, "mouseup", drag_cancel);
		addEvent(window, "mouseleave", drag_cancel);
		addEvent(window, "touchend", drag_cancel);
		addEvent(window, "touchcancel", drag_cancel);
	}
	
	
	
	/*load gl data*/ {
		state.textures.null = gl_create_texture_color(gl, 10, 0, 10, 255);
		state.textures.white = gl_create_texture_color(gl, 255, 255, 255, 255);
		
		/* QUAD */ {
			let positions = new Float32Array([
				-1.0, -1.0,
				 1.0, -1.0,
				-1.0,  1.0,
				 1.0,  1.0,
			]);
			
			let uvs = new Float32Array([
				0.0, 0.0,
				1.0, 0.0,
				0.0, 1.0,
				1.0, 1.0,
			]);
			
			let vertex_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
			
			let texcoord_buffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, texcoord_buffer);
			gl.bufferData(gl.ARRAY_BUFFER, uvs, gl.STATIC_DRAW);
			
			state.models["quad"] = {
				vertices: vertex_buffer,
				uvs: texcoord_buffer
			}
		}
		
		/*sky*/ {
			
			let sun_intensity = 1.0;
			state.sky = {
				sun_street: {
					r: 0.85 * 1 * sun_intensity,
					g: 0.86 * 1 * sun_intensity,
					b: 0.89 * 1 * sun_intensity,
					x: 0,
					y: 2,
					z: 1,
				},
				sun_valley: {
					r: 0.88 * 1 * sun_intensity,
					g: 0.92 * 1 * sun_intensity,
					b: 0.98 * 1 * sun_intensity,
					x: 3,
					y: 1,
					z: -0.1,
				},
				sun_snow: {
					r: 0.9 * 1 * sun_intensity,
					g: 0.84 * 1 * sun_intensity,
					b: 0.71 * 1 * sun_intensity,
					x: 3,
					y: 0.3,
					z: -0.1,
				},
				tex_0: generate_blend_texture(gl, state, 2048, 2048),
				tex_1: generate_blend_texture(gl, state, 2048, 2048),
				tex_2: generate_blend_texture(gl, state, 1024, 512),
				alpha: 0,
				current: null,
				target: null,
			};
		}
		
		
		let request = new XMLHttpRequest();
		request.open("GET", "/traffic_light/scene.json", true);
		request.onreadystatechange = function () {
			if (request.readyState === XMLHttpRequest.DONE) {
				if (request.status === 200) {
					let response = JSON.parse(request.response);
					let response_textures = response.textures;
					for (let keyptr in response_textures) {
						let key = keyptr+"";
						if (response_textures.hasOwnProperty(key)) {
							gl_load_texture(gl, state, key, response_textures[key]);
						}
					}

					let response_models = response.models;
					for (let key in response_models) {
						if (response_models.hasOwnProperty(key)) {
							gl_parse_model(gl, state, response_models[key], key);
						}
					}
				} else {
					console.error("There was an unexpected result: " + request.status + "\n" + request.responseText);
				}
			}
		};
		request.send();
	}
	
	/*load default shader*/ {
		let program = gl_create_program(gl, "_default_vert", "_default_frag");
		state.shaders["default"] = {
			program: program,
			a_position: gl.getAttribLocation(program, "a_position"),
			a_normal: gl.getAttribLocation(program, "a_normal"),
			a_tangent: gl.getAttribLocation(program, "a_tangent"),
			a_texcoord: gl.getAttribLocation(program, "a_texcoord"),
			a_color: gl.getAttribLocation(program, "a_color"),
			
			u_model: gl.getUniformLocation(program, "u_model"),
			u_mvp: gl.getUniformLocation(program, "u_mvp"),
			
			u_color: gl.getUniformLocation(program, "u_color"),
			u_emission: gl.getUniformLocation(program, "u_emission"),
			u_settings0: gl.getUniformLocation(program, "u_settings0"),
			u_eye: gl.getUniformLocation(program, "u_eye"),
			u_sun_direction: gl.getUniformLocation(program, "u_sun_direction"),
			u_sun_color: gl.getUniformLocation(program, "u_sun_color"),
			u_sky_0: gl.getUniformLocation(program, "u_sky_0"),
			u_sky_1: gl.getUniformLocation(program, "u_sky_1"),
			u_sky_2: gl.getUniformLocation(program, "u_sky_2"),
			
			u_light_positions: gl.getUniformLocation(program, "u_light_positions"),
			u_light_strengths: gl.getUniformLocation(program, "u_light_strengths"),
		};
		checkGLErrors(gl);
	}
	
	/*load sky shader*/ {
		let program = gl_create_program(gl, "_sky_vert", "_sky_frag");
		state.shaders["sky"] = {
			program: program,
			a_position: gl.getAttribLocation(program, "a_position"),
			u_eye: gl.getUniformLocation(program, "u_eye"),
			u_mvp: gl.getUniformLocation(program, "u_mvp"),
			u_sky_0: gl.getUniformLocation(program, "u_sky_0"),
			u_sky_1: gl.getUniformLocation(program, "u_sky_1"),
			u_sky_2: gl.getUniformLocation(program, "u_sky_2"),
			u_settings0: gl.getUniformLocation(program, "u_settings0"),
		};
		checkGLErrors(gl);
	}
	
	/*load mixing shader*/ {
		let program = gl_create_program(gl, "_mixer_vert", "_mixer_frag");
		state.shaders["mixer"] = {
			program: program,
			a_position: gl.getAttribLocation(program, "a_position"),
			a_texcoord: gl.getAttribLocation(program, "a_texcoord"),
			u_texture_0: gl.getUniformLocation(program, "u_texture_0"),
			u_texture_1: gl.getUniformLocation(program, "u_texture_1"),
			u_noise_tex: gl.getUniformLocation(program, "u_noise_tex"),
			u_settings0: gl.getUniformLocation(program, "u_settings0"),
		};
		checkGLErrors(gl);
	}
	
	return state;
}






function gl_update(gl, state, canvas, time, deltaTime) {
	state.error = null;
	
	let draw_light = !!state.models["backpanel_black"]
		&& !!state.models["backpanel_white"]
		&& !!state.models["cap"]
		&& !!state.models["cap_back"]
		&& !!state.models["light"]
		&& !!state.shaders["default"];
	
	let draw_sky = !!state.models["sphere"]
		&& !!state.textures["noise"]
		&& !!state.textures["street_0"]
		&& !!state.textures["street_1"]
		&& !!state.textures["street_2"]
		&& !!state.textures["valley_0"]
		&& !!state.textures["valley_1"]
		&& !!state.textures["valley_2"]
		&& !!state.textures["snow_0"]
		&& !!state.textures["snow_1"]
		&& !!state.textures["snow_2"]
		&& !!state.shaders["sky"];
		
	if (!draw_light || !draw_sky) {
		state.error = "Not all assets are ready";
		return;
	}
	
	let tmp0 = state.tmp0;
	let tmp1 = state.tmp1;
	let tmp2 = state.tmp2;
	
	/* CAMERA */ {
		let zoom = state.update_data.zoom.update(deltaTime, state.save_data.zoom);
		let distance = 0.3 + zoom * 1.25;
		let fov = 1.4 - zoom * 0.3;
		let camera_angle_x = state.update_data.camera_angle_x.update(deltaTime, state.save_data.camera_angle_x);
		let camera_angle_y = state.update_data.camera_angle_y.update(deltaTime, state.save_data.camera_angle_y);
		ToQuaternion(state.camera_rotation, camera_angle_y, camera_angle_x, 0);
		v3_mulq(state.camera_position, [0, 0, -distance], state.camera_rotation);
		MatrixView(state.camera_to_world, state.camera_position, state.camera_rotation);
		inverse(state.world_to_camera, state.camera_to_world);
		Perspective(state.tmp0, state.screen.aspect, fov, 0.125, 256);
		mul4x4(state.camera_vp, state.tmp0, state.world_to_camera);
	}
	
	
	/* SKY */ {
		let noise = state.textures["noise"];
		if (state.sky.current == null) {
			state.sky.current = state.save_data.sky_tex;
			state.sky.target = state.save_data.sky_tex;
			
			let stats = state.sky["sun_" + state.sky.current];
			state.sun_color.set([stats.r, stats.g, stats.b]);
			state.sun_direction.set([stats.x, stats.y, stats.z]);
			
			let sky_tex_0 = state.textures[state.sky.current+"_0"];
			let sky_tex_1 = state.textures[state.sky.current+"_1"];
			let sky_tex_2 = state.textures[state.sky.current+"_2"];
			
			state.sky.tex_0.update(sky_tex_0, sky_tex_0, noise, 1.0, 0, 0);
			state.sky.tex_1.update(sky_tex_1, sky_tex_1, noise, 1.0, 0, 0);
			state.sky.tex_2.update(sky_tex_2, sky_tex_2, noise, 1.0, 0, 0);
			gl_refresh_viewport(gl, canvas);
		}
		
		if (state.sky.target != state.sky.current) {
			state.sky.alpha += deltaTime / 1.2;
			let alpha = quad_out(state.sky.alpha);
			let sf = state.sky["sun_" + state.sky.current];
			let sky_tex_0_cur = state.textures[state.sky.current+"_0"];
			let sky_tex_1_cur = state.textures[state.sky.current+"_1"];
			let sky_tex_2_cur = state.textures[state.sky.current+"_2"];
			let st = state.sky["sun_" + state.sky.target];
			let sky_tex_0_tar = state.textures[state.sky.target+"_0"];
			let sky_tex_1_tar = state.textures[state.sky.target+"_1"];
			let sky_tex_2_tar = state.textures[state.sky.target+"_2"];
			if (state.sky.alpha >= 1.0) {
				alpha = 1;
				state.sky.current = state.sky.target;
			}
			
			state.sun_color.set([
				lerp(sf.r, st.r, alpha),
				lerp(sf.g, st.g, alpha),
				lerp(sf.b, st.b, alpha),
			]);
			
			state.sun_direction.set([
				lerp(sf.x, st.x, alpha),
				lerp(sf.y, st.y, alpha),
				lerp(sf.z, st.z, alpha),
			]);
			
			alpha = alpha < 1 ? lerp(0.2, 0.7, alpha) : alpha;
			state.sky.tex_0.update(sky_tex_0_cur, sky_tex_0_tar, noise, alpha, state.sky.offset_x, state.sky.offset_y);
			state.sky.tex_1.update(sky_tex_1_cur, sky_tex_1_tar, noise, alpha, state.sky.offset_x, state.sky.offset_y);
			state.sky.tex_2.update(sky_tex_2_cur, sky_tex_2_tar, noise, alpha, state.sky.offset_x, state.sky.offset_y);
			gl_refresh_viewport(gl, canvas);
		} else if (state.sky.current != state.save_data.sky_tex) {
			state.sky.target = state.save_data.sky_tex;
			state.sky.alpha = 0.0;
			state.sky.offset_x = Math.random();
			state.sky.offset_y = Math.random();
		}
	}
	let sky_tex_0 = state.sky.tex_0.texture;
	let sky_tex_1 = state.sky.tex_1.texture;
	let sky_tex_2 = state.sky.tex_2.texture;
	
	
	
	
	gl.bindFramebuffer(gl.FRAMEBUFFER, null);
	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	gl.disable(gl.DEPTH_TEST);
	gl.depthMask(false);
	
	if (draw_sky) {
		let sky = state.objects.sky;
		sky.shade0.set([+state.update_data.white_noise, 0, time, 0]);
		sky.model[12] = state.camera_position[0];
		sky.model[13] = state.camera_position[1];
		sky.model[14] = state.camera_position[2];
		mul4x4(sky.mvp, state.camera_vp, sky.model);
		
		let shader = state.shaders["sky"];
		gl.useProgram(shader.program);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_0);
		gl.uniform1i(shader.u_sky_0, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_1);
		gl.uniform1i(shader.u_sky_1, 1);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_2);
		gl.uniform1i(shader.u_sky_2, 2);
		
		let model = state.models["sphere"];
		gl.bindBuffer(gl.ARRAY_BUFFER, model.vertices);
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.indices);
		
		gl.enableVertexAttribArray(shader.a_position);
		gl.vertexAttribPointer(shader.a_position, 3, gl.FLOAT, false, 64, 0);
		gl.uniform3fv(shader.u_eye, state.camera_position);
		gl.uniform4fv(shader.u_settings0, sky.shade0);
		gl.uniformMatrix4fv(shader.u_mvp, false, sky.mvp);
		gl.drawElements(gl.TRIANGLES, model.index_count, gl.UNSIGNED_SHORT, model.indices);
		gl.disableVertexAttribArray(shader.a_position);
	}
	
	gl.depthMask(true);
	gl.enable(gl.DEPTH_TEST);
	
	ToQuaternion(tmp0, time, time * 0.4, time * 0.14)
	ToQuaternion(tmp0, 0, Math.PI, 0)
	RT(tmp1, tmp0, [0, Math.sin(time) * 0, 0]);
	mul4x4_pos(state.point_light_pos0, tmp1, [0.0,  0.2, 0.08]);
	mul4x4_pos(state.point_light_pos1, tmp1, [0.0,  0.0, 0.08]);
	mul4x4_pos(state.point_light_pos2, tmp1, [0.0, -0.2, 0.08]);
	
	state.point_lights_str[0] = state.update_data.red.update(deltaTime, +state.save_data.red);
	state.point_lights_str[1] = state.update_data.orange.update(deltaTime, +state.save_data.orange);
	state.point_lights_str[2] = state.update_data.green.update(deltaTime, +state.save_data.green);
	
	if (draw_light) {
		let shader = state.shaders["default"];
		gl.useProgram(shader.program);
		
		gl.enableVertexAttribArray(shader.a_position);
		gl.enableVertexAttribArray(shader.a_normal);
		gl.enableVertexAttribArray(shader.a_tangent);
		gl.enableVertexAttribArray(shader.a_texcoord);
		gl.enableVertexAttribArray(shader.a_color);
		
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_0);
		gl.uniform1i(shader.u_sky_0, 0);
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_1);
		gl.uniform1i(shader.u_sky_1, 1);
		gl.activeTexture(gl.TEXTURE2);
		gl.bindTexture(gl.TEXTURE_2D, sky_tex_2);
		gl.uniform1i(shader.u_sky_2, 2);
		
		gl.uniform3fv(shader.u_sun_color, state.sun_color);
		gl.uniform3fv(shader.u_sun_direction, state.sun_direction);
		gl.uniform3fv(shader.u_eye, state.camera_position);
		gl.uniformMatrix3fv(shader.u_light_positions, false, state.point_lights_pos);
		gl.uniform3fv(shader.u_light_strengths, state.point_lights_str);
		
		if (state.update_data.show_pole) {
			gl_draw_obj(gl, state, state.objects.tl_pole_black, state.models["pole_black"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_pole_white, state.models["pole_white"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_ground, state.models["ground"], tmp1, shader, tmp2);
		}
		
		if (state.update_data.show_light) {
			gl_draw_obj(gl, state, state.objects.tl_back, state.models["backpanel_black"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_rim, state.models["backpanel_white"], tmp1, shader, tmp2);
			
			gl_draw_obj(gl, state, state.objects.tl_red_back, state.models["cap_back"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_red_cap, state.models["cap"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_orange_back, state.models["cap_back"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_orange_cap, state.models["cap"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_green_back, state.models["cap_back"], tmp1, shader, tmp2);
			gl_draw_obj(gl, state, state.objects.tl_green_cap, state.models["cap"], tmp1, shader, tmp2);
			
			gl.uniform3f(shader.u_light_strengths, state.point_lights_str[0], 0, 0);
			gl_draw_obj(gl, state, state.objects.tl_red_light, state.models["light"], tmp1, shader, tmp2);
			
			gl.uniform3f(shader.u_light_strengths, 0, state.point_lights_str[1], 0);
			gl_draw_obj(gl, state, state.objects.tl_orange_light, state.models["light"], tmp1, shader, tmp2);
			
			gl.uniform3f(shader.u_light_strengths, 0, 0, state.point_lights_str[2]);
			gl_draw_obj(gl, state, state.objects.tl_green_light, state.models["light"], tmp1, shader, tmp2);
		}
		
		gl.disableVertexAttribArray(shader.a_position);
		gl.disableVertexAttribArray(shader.a_normal);
		gl.disableVertexAttribArray(shader.a_tangent);
		gl.disableVertexAttribArray(shader.a_texcoord);
		gl.disableVertexAttribArray(shader.a_color);
	}
	
	if (state.update_data.queue_screenshot) {
		state.update_data.queue_screenshot = false;
		let link = document.createElement('a');
		link.download = "canvas_" + (state.update_data.show_light ? "y_" : "n_") + (new Date()).valueOf() + ".png";
		link.href = canvas.toDataURL("image/jpeg")
		link.click();
	}
}