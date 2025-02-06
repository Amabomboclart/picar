function addEvent(object, type, callback) {
	if (object == null || typeof (object) == 'undefined') return;
	if (object.addEventListener) object.addEventListener(type, callback, false);
	else if (object.attachEvent) object.attachEvent("on" + type, callback);
	else object["on" + type] = callback;
};

const Base64Arr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
function Base64ToUint8(data) {
	let len = data.length / 4 * 3;
	if (data.charAt(data.length - 1) === "=") len--;
	if (data.charAt(data.length - 2) === "=") len--;
	var bytes = new Uint8Array(len);
	for (let i = 0, j = 0; i < len; i += 3) {
		let enc1 = Base64Arr.indexOf(data.charAt(j++));
		let enc2 = Base64Arr.indexOf(data.charAt(j++));
		let enc3 = Base64Arr.indexOf(data.charAt(j++));
		let enc4 = Base64Arr.indexOf(data.charAt(j++));
		let chr1 = (enc1 << 2) | (enc2 >> 4);
		let chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
		let chr3 = ((enc3 & 3) << 6) | enc4;
		bytes[i] = chr1;
		if (enc3 != 64) bytes[i + 1] = chr2;
		if (enc4 != 64) bytes[i + 2] = chr3;
	}
	return bytes;
}

function Uint8ToUint16(data) {
	let len = data.length / 2;
	if (len != Math.round(len)) console.error("Incorrect size: " + len);
	let array = new Uint16Array(len);
	let view = new DataView(data.buffer);
	for (var i = 0; i < len; i++)
		array[i] = view.getUint16(i * 2, false);
	return array;
}

function inverse(m_inv,m){let a0=m[0]*m[5]-m[1]*m[4],a1=m[0]*m[6]-m[2]*m[4],a2=m[0]*m[7]-m[3]*m[4],a3=m[1]*m[6]-m[2]*m[5],a4=m[1]*m[7]-m[3]*m[5],a5=m[2]*m[7]-m[3]*m[6],b0=m[8]*m[13]-m[9]*m[12],b1=m[8]*m[14]-m[10]*m[12],b2=m[8]*m[15]-m[11]*m[12],b3=m[9]*m[14]-m[10]*m[13],b4=m[9]*m[15]-m[11]*m[13],b5=m[10]*m[15]-m[11]*m[14],determinant=a0*b5-a1*b4+a2*b3+a3*b2-a4*b1+a5*b0;m_inv[0]=0+m[5]*b5-m[6]*b4+m[7]*b3;m_inv[4]=0-m[4]*b5+m[6]*b2-m[7]*b1;m_inv[8]=0+m[4]*b4-m[5]*b2+m[7]*b0;m_inv[12]=0-m[4]*b3+m[5]*b1-m[6]*b0;m_inv[1]=0-m[1]*b5+m[2]*b4-m[3]*b3;m_inv[5]=0+m[0]*b5-m[2]*b2+m[3]*b1;m_inv[9]=0-m[0]*b4+m[1]*b2-m[3]*b0;m_inv[13]=0+m[0]*b3-m[1]*b1+m[2]*b0;m_inv[2]=0+m[13]*a5-m[14]*a4+m[15]*a3;m_inv[6]=0-m[12]*a5+m[14]*a2-m[15]*a1;m_inv[10]=0+m[12]*a4-m[13]*a2+m[15]*a0;m_inv[14]=0-m[12]*a3+m[13]*a1-m[14]*a0;m_inv[3]=0-m[9]*a5+m[10]*a4-m[11]*a3;m_inv[7]=0+m[8]*a5-m[10]*a2+m[11]*a1;m_inv[11]=0-m[8]*a4+m[9]*a2-m[11]*a0;m_inv[15]=0+m[8]*a3-m[9]*a1+m[10]*a0;let inverse_det=1.0/determinant;m_inv[0]*=inverse_det;m_inv[1]*=inverse_det;m_inv[2]*=inverse_det;m_inv[3]*=inverse_det;m_inv[4]*=inverse_det;m_inv[5]*=inverse_det;m_inv[6]*=inverse_det;m_inv[7]*=inverse_det;m_inv[8]*=inverse_det;m_inv[9]*=inverse_det;m_inv[10]*=inverse_det;m_inv[11]*=inverse_det;m_inv[12]*=inverse_det;m_inv[13]*=inverse_det;m_inv[14]*=inverse_det;m_inv[15]*=inverse_det;}
function mul4x4(o,l,r){let r0=r[0],r1=r[1],r2=r[2],r3=r[3];o[0]=r0*l[0]+r1*l[4]+r2*l[8]+r3*l[12];o[1]=r0*l[1]+r1*l[5]+r2*l[9]+r3*l[13];o[2]=r0*l[2]+r1*l[6]+r2*l[10]+r3*l[14];o[3]=r0*l[3]+r1*l[7]+r2*l[11]+r3*l[15];r0=r[4];r1=r[5];r2=r[6];r3=r[7];o[4]=r0*l[0]+r1*l[4]+r2*l[8]+r3*l[12];o[5]=r0*l[1]+r1*l[5]+r2*l[9]+r3*l[13];o[6]=r0*l[2]+r1*l[6]+r2*l[10]+r3*l[14];o[7]=r0*l[3]+r1*l[7]+r2*l[11]+r3*l[15];r0=r[8];r1=r[9];r2=r[10];r3=r[11];o[8]=r0*l[0]+r1*l[4]+r2*l[8]+r3*l[12];o[9]=r0*l[1]+r1*l[5]+r2*l[9]+r3*l[13];o[10]=r0*l[2]+r1*l[6]+r2*l[10]+r3*l[14];o[11]=r0*l[3]+r1*l[7]+r2*l[11]+r3*l[15];r0=r[12];r1=r[13];r2=r[14];r3=r[15];o[12]=r0*l[0]+r1*l[4]+r2*l[8]+r3*l[12];o[13]=r0*l[1]+r1*l[5]+r2*l[9]+r3*l[13];o[14]=r0*l[2]+r1*l[6]+r2*l[10]+r3*l[14];o[15]=r0*l[3]+r1*l[7]+r2*l[11]+r3*l[15];return o;}
function mul4x4_pos(o,l,r){
    o[0]=r[0]*l[0]+r[1]*l[4]+r[2]*l[8]+l[12];
    o[1]=r[0]*l[1]+r[1]*l[5]+r[2]*l[9]+l[13];
    o[2]=r[0]*l[2]+r[1]*l[6]+r[2]*l[10]+l[14];
    return o;
}
function mul4x4_vec4(o,l,r){
    o[0]=r[0]*l[0]+r[1]*l[4]+r[2]*l[8]+r[3]*l[12];
    o[1]=r[0]*l[1]+r[1]*l[5]+r[2]*l[9]+r[3]*l[13];
    o[2]=r[0]*l[2]+r[1]*l[6]+r[2]*l[10]+r[3]*l[14];
    o[3]=r[0]*l[3]+r[1]*l[7]+r[2]*l[11]+r[3]*l[15];
    return o;
}


function mulq(o,l,r){o[0]=l[3]*r[0]+l[0]*r[3]+l[1]*r[2]-l[2]*r[1];o[1]=l[3]*r[1]+l[1]*r[3]+l[2]*r[0]-l[0]*r[2];o[2]=l[3]*r[2]+l[2]*r[3]+l[0]*r[1]-l[1]*r[0];o[3]=l[3]*r[3]-l[0]*r[0]-l[1]*r[1]-l[2]*r[2];}
function v3_cross(o,l,r){o[0]=l[1]*r[2]-l[2]*r[1];o[1]=l[2]*r[0]-l[0]*r[2];o[2]=l[0]*r[1]-l[1]*r[0];}
function v3_dot(l,r){return l[0]*r[0]+l[1]*r[1]+l[2]*r[2];};
function v3_add(o,l,r){o[0]=l[0]+r[0];o[1]=l[1]+r[1];o[2]=l[2]+r[2];}
function v3_sub(o,l,r){o[0]=l[0]-r[0];o[1]=l[1]-r[1];o[2]=l[2]-r[2];}
function v3_muls(o,l,r){o[0]=l[0]*r;o[1]=l[1]*r;o[2]=l[2]*r;}
function v3_mov(o,l,r,t) {
	o[0]=Math.abs(l[0]-r[0])<t ? r[0] : l[0]+Math.sign(r[0]-l[0])*t;
	o[1]=Math.abs(l[1]-r[1])<t ? r[1] : l[1]+Math.sign(r[1]-l[1])*t;
	o[2]=Math.abs(l[2]-r[2])<t ? r[2] : l[2]+Math.sign(r[2]-l[2])*t;
}
function v3_mulq(o, l, r) { /* l: position, r: quaternion */
    let dlr = l[0]*r[0] + l[1]*r[1] + l[2]*r[2];
    let drr = r[0]*r[0] + r[1]*r[1] + r[2]*r[2];
    let tm0 = r[3]*r[3] - drr;
    o[0] = (r[1]*l[2] - r[2]*l[1]) * r[3] * 2 + (tm0 * l[0]) + (2 * dlr * r[0]);
    o[1] = (r[2]*l[0] - r[0]*l[2]) * r[3] * 2 + (tm0 * l[1]) + (2 * dlr * r[1]);
    o[2] = (r[0]*l[1] - r[1]*l[0]) * r[3] * 2 + (tm0 * l[2]) + (2 * dlr * r[2]);
}

function v4_dot(l,r){return l[0]*r[0]+l[1]*r[1]+l[2]*r[2]+l[3]*r[3];}
function v4_sub(o,l,r){o[0]=l[0]-r[0];o[1]=l[1]-r[1];o[2]=l[2]-r[2];o[3]=l[3]-r[3];}
function v4_add(o,l,r){o[0]=l[0]+r[0];o[1]=l[1]+r[1];o[2]=l[2]+r[2];o[3]=l[3]+r[3];}
function v4_muls(o,l,r){o[0]=l[0]*r;o[1]=l[1]*r;o[2]=l[2]*r;o[3]=l[3]*r;}
function followv4(o,l,r,v,t,d,c0,c1) {
	let sinv = 2/t;
	let x = sinv * d;
	let xx = x*x;
	let exp = 1/(1+x+0.48*xx+0.235*xx*x);
	v4_sub(c0,l,r);
	v4_muls(c1,c0,sinv);
	v4_add(c1,c1,v);
	v4_muls(c1,c1,d);
	v4_muls(o,c1,sinv);
	v4_sub(v,v,o);
	v4_muls(v,v,exp);
	v4_add(o,c0,c1);
	v4_muls(o,o,exp);
	v4_add(o,o,r);
}

function look(o,l,r) {
	v3_cross(o,l,r);
	o[3]=Math.sqrt(v3_dot(l,l)*v3_dot(r,r))+v3_dot(l,r);
	let m = 1/Math.sqrt(v4_dot(o,o));
	v4_muls(o,o,m);
}

function RTS(matrix, q, scale, position) {
	let sqw = q[3]*q[3];
	let sqx = q[0]*q[0];
	let sqy = q[1]*q[1];
	let sqz = q[2]*q[2];
	let invs = 1.0 / (sqx + sqy + sqz + sqw);
	let m00 = ( sqx - sqy - sqz + sqw)*invs;
	let m11 = (-sqx + sqy - sqz + sqw)*invs;
	let m22 = (-sqx - sqy + sqz + sqw)*invs;
	
	let tmp1 = q[0]*q[1];
	let tmp2 = q[2]*q[3];
	let m10 = 2.0 * (tmp1 + tmp2)*invs;
	let m01 = 2.0 * (tmp1 - tmp2)*invs;
	
	tmp1 = q[0]*q[2];
	tmp2 = q[1]*q[3];
	let m20 = 2.0 * (tmp1 - tmp2)*invs;
	let m02 = 2.0 * (tmp1 + tmp2)*invs;
	tmp1 = q[1]*q[2];
	tmp2 = q[0]*q[3];
	let m21 = 2.0 * (tmp1 + tmp2)*invs;
	let m12 = 2.0 * (tmp1 - tmp2)*invs;
	
	matrix[ 0] = scale[0] * m00;
	matrix[ 1] = scale[1] * m10;
	matrix[ 2] = scale[2] * m20;
	matrix[ 3] = 0;
	
	matrix[ 4] = scale[0] * m01;
	matrix[ 5] = scale[1] * m11;
	matrix[ 6] = scale[2] * m21;
	matrix[ 7] = 0;
	
	matrix[ 8] = scale[0] * m02;
	matrix[ 9] = scale[1] * m12;
	matrix[10] = scale[2] * m22;
	matrix[11] = 0;
	
	matrix[12] = position[0];
	matrix[13] = position[1];
	matrix[14] = position[2];
	matrix[15] = 1;
}

function RT(matrix, q, position) {
	let sqw = q[3]*q[3];
	let sqx = q[0]*q[0];
	let sqy = q[1]*q[1];
	let sqz = q[2]*q[2];
	let invs = 1.0 / (sqx + sqy + sqz + sqw);
	let m00 = ( sqx - sqy - sqz + sqw)*invs;
	let m11 = (-sqx + sqy - sqz + sqw)*invs;
	let m22 = (-sqx - sqy + sqz + sqw)*invs;
	
	let tmp1 = q[0]*q[1];
	let tmp2 = q[2]*q[3];
	let m10 = 2.0 * (tmp1 + tmp2)*invs;
	let m01 = 2.0 * (tmp1 - tmp2)*invs;
	
	tmp1 = q[0]*q[2];
	tmp2 = q[1]*q[3];
	let m20 = 2.0 * (tmp1 - tmp2)*invs;
	let m02 = 2.0 * (tmp1 + tmp2)*invs;
	tmp1 = q[1]*q[2];
	tmp2 = q[0]*q[3];
	let m21 = 2.0 * (tmp1 + tmp2)*invs;
	let m12 = 2.0 * (tmp1 - tmp2)*invs;
	
	matrix[ 0] = m00;
	matrix[ 1] = m10;
	matrix[ 2] = m20;
	matrix[ 3] = 0;
	
	matrix[ 4] = m01;
	matrix[ 5] = m11;
	matrix[ 6] = m21;
	matrix[ 7] = 0;
	
	matrix[ 8] = m02;
	matrix[ 9] = m12;
	matrix[10] = m22;
	matrix[11] = 0;
	
	matrix[12] = position[0];
	matrix[13] = position[1];
	matrix[14] = position[2];
	matrix[15] = 1;
}


function ToQuaternion(quaternion, x, y, z) {
	let cx = Math.cos(y / 2);
	let sx = Math.sin(y / 2);
	let cy = Math.cos(z / 2);
	let sy = Math.sin(z / 2);
	let cz = Math.cos(x / 2);
	let sz = Math.sin(x / 2);
	quaternion[0] = cx * cy * sz + sx * sy * cz;
	quaternion[1] = sx * cy * cz + cx * sy * sz;
	quaternion[2] = cx * sy * cz - sx * cy * sz;
	quaternion[3] = cx * cy * cz - sx * sy * sz;
}

function MatrixView(m, p, q)
{
	let sqw = q[3] * q[3], sqx = q[0] * q[0], sqy = q[1] * q[1], sqz = q[2] * q[2];
	let invs = 1.0 / (sqx + sqy + sqz + sqw);
	let m00 = (sqx - sqy - sqz + sqw) * invs, m11 = (-sqx + sqy - sqz + sqw) * invs, m22 = (-sqx - sqy + sqz + sqw) * invs;
	let tmp1 = q[0] * q[1],	tmp2 = q[2] * q[3];
	let m10 = 2.0 * (tmp1 + tmp2) * invs, m01 = 2.0 * (tmp1 - tmp2) * invs;

	tmp1 = q[0] * q[2];
	tmp2 = q[1] * q[3];
	let m20 = 2.0 * (tmp1 - tmp2) * invs, m02 = 2.0 * (tmp1 + tmp2) * invs;
	tmp1 = q[1] * q[2];
	tmp2 = q[0] * q[3];
	let m21 = 2.0 * (tmp1 + tmp2) * invs, m12 = 2.0 * (tmp1 - tmp2) * invs;
	
	m.set([
		m00, m10, m20, 0,
		m01, m11, m21, 0,
		-m02, -m12, -m22, 0,
		p[0], p[1], p[2], 1.0,
	]);
}

function Perspective(m, aspect, ffd, ncp, fcp) {
	let d = fcp / (ncp-fcp);
	let e = (2 * fcp * ncp) / (ncp - fcp);
	m.set([ffd/aspect,0,0,0, 0,ffd,0,0, 0,0,d,-1, 0,0,e,0]);
}

function hermite(t) { return t * t * (3 - 2 * t); }
function quad_out(t) { return -t * (t - 2); }
function lerp(f, t, x) { return f * (1 - x) + t * x; }

function follower(smooth_time, is_angle, start_value) {
    let state = {
        current: start_value || 0,
        velocity: 0,
    };
    state.update = function(delta_time, target) {
        if (is_angle) {
            let delta_angle = target - state.current;
            delta_angle = delta_angle - Math.floor(delta_angle / 360) * 360;
            if (delta_angle < 0) delta_angle = 0;
            if (delta_angle > 180) delta_angle -= 360;
            target = delta_angle + state.current;
        }
        
        let omega = 2 / smooth_time;
        let x = omega * delta_time;
        let exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
        let change = state.current - target;
        let originalTo = target;
        target = state.current - change;
        let temp = (state.velocity + omega * change) * delta_time;
        state.velocity = (state.velocity - omega * temp) * exp;
        let output = target + (change + temp) * exp;
        if (originalTo - state.current > 0 == output > originalTo)
        {
            output = originalTo;
            state.velocity = (output - originalTo) / delta_time;
        }
        return state.current = output;
    };
    return state;
}
