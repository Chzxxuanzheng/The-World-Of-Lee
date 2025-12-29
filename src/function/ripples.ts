/**
 * 借鉴于https://github.com/sirxemic/jquery.ripples
 * 经ai重写为TypeScript，修改（不会WebGL，只能请ai了...）
 */

interface RipplesConfig {
	resolution?:  number;
	perturbance?: number;
	dissipation?: number;
	crossOrigin?: string;
}

interface Ripple {
	x: number;
	y: number;
	radius: number;
	strength: number;
	maxAge: number;
}

interface WebGLConfig {
	type: number;
	arrayType: typeof Float32Array | null;
	linearSupport: boolean;
	extensions: string[];
}

export class Ripples {
	private readonly canvas: HTMLCanvasElement
	private readonly gl: WebGLRenderingContext
	private readonly config: Required<RipplesConfig>
	private readonly glConfig: WebGLConfig | null
	private readonly offscreen: HTMLCanvasElement = document.createElement('canvas')
	private readonly image = new Image()

	private readonly textureDelta: Float32Array
	private readonly textures: WebGLTexture[] = []
	private readonly framebuffers: WebGLFramebuffer[] = []
	private bufferWriteIndex = 0
	private bufferReadIndex = 1

	private readonly quad: WebGLBuffer
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private dropProgram: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private updateProgram: any
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private renderProgram: any

	private readonly backgroundTexture: WebGLTexture

	private ripples: Ripple[] = []
	private animationFrameId: number | null = null
	private readonly resizeObserver: ResizeObserver

	private destroyed = false

	public onload?: () => void

	constructor(
		canvas: HTMLCanvasElement,
		imageUrl: string,
		config:  RipplesConfig = {},
	) {
		this.canvas = canvas
		this.config = {
			resolution: config.resolution ?? 256,
			perturbance: config.perturbance ?? 0.03,
			dissipation: config.dissipation ?? 0.995,
			crossOrigin: config.crossOrigin ?? 'anonymous',
		}

		// Initialize WebGL context
		const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | undefined
		if (!gl) {
			throw new Error('WebGL is not supported')
		}
		this.gl = gl

		// Load WebGL configuration
		this.glConfig = this.loadGLConfig()
		if (!this.glConfig) {
			throw new Error('Required WebGL extensions are not supported')
		}

		// Load extensions
		this.glConfig.extensions.forEach(name => {
			gl.getExtension(name)
		})

		// Initialize texture delta
		this.textureDelta = new Float32Array([
			1 / this.config.resolution,
			1 / this.config.resolution,
		])

		// Initialize WebGL resources
		this.initFramebuffers()
		this.quad = this.createQuadBuffer()
		this.initShaders()
		this.backgroundTexture = this.initBackgroundTexture()

		// Load background image
		this.loadImage(imageUrl)

		// Set up GL state
		gl.clearColor(0, 0, 0, 0)
		gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

		// Set up resize observer for canvas size changes
		this.resizeObserver = new ResizeObserver(() => {
			this.handleResize()
		})
		this.resizeObserver.observe(canvas)

		// Start animation loop
		this.startAnimation()
	}

	private loadGLConfig(): WebGLConfig | null {
		const gl = this.gl
    
		// Load extensions
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const extensions:  Record<string, any> = {};
		[
			'OES_texture_float',
			'OES_texture_half_float',
			'OES_texture_float_linear',
			'OES_texture_half_float_linear',
		].forEach(name => {
			const extension = gl.getExtension(name)
			if (extension) {
				extensions[name] = extension
			}
		})

		// Check for required extension
		if (!extensions.OES_texture_float) {
			return null
		}

		const configs: WebGLConfig[] = []

		// Float texture config
		configs.push({
			type: gl.FLOAT,
			arrayType: Float32Array,
			linearSupport: 'OES_texture_float_linear' in extensions,
			extensions: ['OES_texture_float', 'OES_texture_float_linear']. filter(
				name => name in extensions,
			),
		})

		// Half float config
		if (extensions.OES_texture_half_float) {
			configs.push({
				type: extensions.OES_texture_half_float.HALF_FLOAT_OES,
				arrayType:  null,
				linearSupport: 'OES_texture_half_float_linear' in extensions,
				extensions: ['OES_texture_half_float', 'OES_texture_half_float_linear'].filter(
					name => name in extensions,
				),
			})
		}

		// Test rendering to texture
		const texture = gl.createTexture()
		const framebuffer = gl.createFramebuffer()
    
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
		gl.bindTexture(gl. TEXTURE_2D, texture)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

		for (const config of configs) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 32, 32, 0, gl.RGBA, config.type, null)
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0)

			if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE) {
				gl.deleteTexture(texture)
				gl.deleteFramebuffer(framebuffer)
				return config
			}
		}

		gl. deleteTexture(texture)
		gl.deleteFramebuffer(framebuffer)
		return null
	}

	private initFramebuffers(): void {
		const gl = this.gl
		const resolution = this.config.resolution
		const glConfig = this.glConfig! 
    
		const arrayType = glConfig.arrayType
		const textureData = arrayType ? new arrayType(resolution * resolution * 4) : null

		for (let i = 0; i < 2; i++) {
			const texture = gl.createTexture()
			const framebuffer = gl.createFramebuffer()

			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer)
			gl.bindTexture(gl.TEXTURE_2D, texture)

			const filter = glConfig.linearSupport ? gl. LINEAR : gl.NEAREST
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter)
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
			gl.texParameteri(gl. TEXTURE_2D, gl. TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
			gl.texImage2D(
				gl.TEXTURE_2D, 0, gl.RGBA,
				resolution, resolution, 0,
				gl.RGBA, glConfig.type, textureData,
			)

			gl.framebufferTexture2D(
				gl.FRAMEBUFFER,
				gl.COLOR_ATTACHMENT0,
				gl.TEXTURE_2D,
				texture,
				0,
			)

			this.textures.push(texture)
			this.framebuffers.push(framebuffer)
		}
	}

	private createQuadBuffer(): WebGLBuffer {
		const gl = this. gl
		const quad = gl.createBuffer()
    
		gl.bindBuffer(gl. ARRAY_BUFFER, quad)
		gl.bufferData(
			gl.ARRAY_BUFFER,
			new Float32Array([-1, -1, +1, -1, +1, +1, -1, +1]),
			gl.STATIC_DRAW,
		)
    
		return quad
	}

	private initShaders(): void {
		const gl = this.gl
    
		const vertexShader = `
		attribute vec2 vertex;
		varying vec2 coord;
		void main() {
			coord = vertex * 0.5 + 0.5;
			gl_Position = vec4(vertex, 0.0, 1.0);
		}
    `

		// Drop shader
		this.dropProgram = this.createProgram(vertexShader, `
		precision highp float;
		const float PI = 3.141592653589793;
		uniform sampler2D texture;
		uniform vec2 center;
		uniform float radius;
		uniform float strength;
		uniform vec2 ratio;
		varying vec2 coord;
		
		void main() {
			vec4 info = texture2D(texture, coord);
			vec2 diff = (center * 0.5 + 0.5) - coord;
			diff *= ratio;
			float drop = max(0.0, 1.0 - length(diff) / radius);
			drop = 0.5 - cos(drop * PI) * 0.5;
			info.r += drop * strength;
			gl_FragColor = info;
		}
    `)

		// Update shader
		this.updateProgram = this.createProgram(vertexShader, `
		precision highp float;
		uniform sampler2D texture;
		uniform vec2 delta;
		uniform float dissipation;
		varying vec2 coord;
		
		void main() {
			vec4 info = texture2D(texture, coord);
			vec2 dx = vec2(delta.x, 0.0);
			vec2 dy = vec2(0.0, delta.y);
			
			float average = (
				texture2D(texture, coord - dx).r +
				texture2D(texture, coord - dy).r +
				texture2D(texture, coord + dx).r +
				texture2D(texture, coord + dy).r
			) * 0.25;
			
			info.g += (average - info.r) * 2.0;
			info.g *= dissipation;
			info.r += info.g;
			
			gl_FragColor = info;
		}
    `)
		gl.uniform2fv(this.updateProgram.locations.delta, this. textureDelta)

		// Render shader
		this.renderProgram = this.createProgram(`
			precision highp float;
			attribute vec2 vertex;
			varying vec2 ripplesCoord;
			varying vec2 backgroundCoord;
			
			void main() {
				backgroundCoord.y = 1.0 - backgroundCoord.y;
				backgroundCoord = vertex * 0.5 + 0.5;
				ripplesCoord = vertex * 0.5 + 0.5;
				gl_Position = vec4(vertex, 0.0, 1.0);
			}`,`
			precision highp float;
			uniform sampler2D samplerBackground;
			uniform sampler2D samplerRipples;
			uniform vec2 delta;
			uniform float perturbance;
			varying vec2 ripplesCoord;
			varying vec2 backgroundCoord;
			
			void main() {
				float height = texture2D(samplerRipples, ripplesCoord).r;
				float heightX = texture2D(samplerRipples, vec2(ripplesCoord. x + delta.x, ripplesCoord.y)).r;
				float heightY = texture2D(samplerRipples, vec2(ripplesCoord.x, ripplesCoord.y + delta.y)).r;
				vec3 dx = vec3(delta.x, heightX - height, 0.0);
				vec3 dy = vec3(0.0, heightY - height, delta.y);
				vec2 offset = -normalize(cross(dy, dx)).xz;
				float specular = pow(max(0.0, dot(offset, normalize(vec2(-0.6, 1.0)))), 4.0);
				gl_FragColor = texture2D(samplerBackground, backgroundCoord + offset * perturbance) + specular;
			}`,
		)
		gl.uniform2fv(this.renderProgram.locations.delta, this.textureDelta)
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	private createProgram(vertexSource: string, fragmentSource: string): any {
		const gl = this. gl
    
		const compileShader = (type: number, source: string): WebGLShader => {
			const shader = gl.createShader(type)!
			gl.shaderSource(shader, source)
			gl.compileShader(shader)

			if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
				throw new Error('Shader compile error: ' + gl.getShaderInfoLog(shader))
			}

			return shader
		}

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const program: any = { uniforms: {}, locations: {} }
		program.id = gl.createProgram()!
    
		gl.attachShader(program.id, compileShader(gl. VERTEX_SHADER, vertexSource))
		gl.attachShader(program.id, compileShader(gl.FRAGMENT_SHADER, fragmentSource))
		gl.linkProgram(program. id)
    
		if (!gl.getProgramParameter(program.id, gl.LINK_STATUS)) {
			throw new Error('Program link error: ' + gl.getProgramInfoLog(program.id))
		}

		gl.useProgram(program.id)
		gl.enableVertexAttribArray(0)

		// Extract uniforms
		const regex = /uniform (\w+) (\w+)/g
		const shaderCode = vertexSource + fragmentSource
		let match
    
		while ((match = regex.exec(shaderCode)) !== null) {
			const name = match[2]!
			program.locations[name] = gl.getUniformLocation(program.id, name)
		}

		return program
	}

	private initBackgroundTexture(): WebGLTexture {
		const gl = this.gl
		const texture = gl.createTexture()

		gl.bindTexture(gl.TEXTURE_2D, texture)
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)

		return texture
	}
	private loadImage(url: string): void {
		this.image.onload = () => {
			this.handleResize()
			this.onload?.()
		}

		this.image.onerror = () => {
			throw new Error('Failed to load image')
		}

		this.image.crossOrigin = this.config.crossOrigin
		this.image.src = url
	}

	public addRipple(x: number, y: number, strength: number): void {
		const maxAge = 3000 // milliseconds
    
		this.ripples.push({
			x,
			y,
			radius: 0.1,
			strength,
			maxAge,
		})
	}

	private handleResize(): void {
		const { width, height } = this.canvas.getBoundingClientRect()
		const gl = this.gl

		this.canvas.width = width
		this.canvas.height = height

		this.offscreen.width = width
		this.offscreen.height = height
		const ctx = this.offscreen.getContext('2d')

		if (ctx) {
			const imgRatio = this.image.width / this.image.height
			const canvasRatio = width / height

			let drawWidth, drawHeight, x, y

			// 核心 Cover 算法：
			if (canvasRatio > imgRatio) {
				// 画布更宽：图片宽度撑满，高度等比缩放并居中裁剪（上下溢出）
				drawWidth = width
				drawHeight = width / imgRatio
				x = 0
				y = (height - drawHeight) / 2
			} else {
				// 画布更高：图片高度撑满，宽度等比缩放并居中裁剪（左右溢出）
				drawWidth = height * imgRatio
				drawHeight = height
				x = (width - drawWidth) / 2
				y = 0
			}

			// 将处理好的图片绘制到离屏画布
			ctx.drawImage(this.image, x, y, drawWidth, drawHeight)
		}

		// 3. WebGL 纹理配置
		const isPowerOfTwo = (x: number) => (x & (x - 1)) === 0
		// 使用处理后的 offscreen 宽高判断 wrapping
		const wrapping = (isPowerOfTwo(this.offscreen.width) && isPowerOfTwo(this.offscreen.height)) ? gl.REPEAT : gl.CLAMP_TO_EDGE

		gl.bindTexture(gl.TEXTURE_2D, this.backgroundTexture)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrapping)
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrapping)

		// 注意：这里上传的是 offscreen canvas 而不是原始 image
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.offscreen)
	}

	private updateRipples(deltaTime: number): void {
		const gl = this.gl
    
		// Update and remove old ripples
		this.ripples = this.ripples.filter(ripple => {
			ripple.radius += deltaTime * 0.0003

			ripple.strength *= 0.95
			return ripple.strength > 0.001 && ripple.radius < 1
		})

		// Apply each ripple
		if (this.ripples.length > 0) {
			gl.viewport(0, 0, this.config.resolution, this.config.resolution)

			for (const ripple of this.ripples) {
				this.applyDrop(ripple.x, ripple.y, ripple.radius, ripple.strength)
			}
		}
	}

	private applyDrop(x: number, y: number, radius: number, strength: number): void {
		const gl = this.gl
		const longestSide = Math.max(this.canvas.width, this.canvas.height)
		const ratio = new Float32Array([
			this.canvas.width / longestSide,
			this.canvas.height / longestSide,
		])
    
		const normalizedRadius = radius
		const dropPosition = new Float32Array([
			(2 * x - this.canvas.width) / this.canvas.width,
			(this.canvas.height - 2 * y) / this.canvas.height,
		])

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.bufferWriteIndex]!)
		this.bindTexture(this.textures[this.bufferReadIndex]!, 0)

		gl.useProgram(this.dropProgram.id)
		gl.uniform2fv(this.dropProgram.locations.center, dropPosition)
		gl.uniform1f(this.dropProgram.locations.radius, normalizedRadius)
		gl.uniform1f(this.dropProgram.locations.strength, strength)
		gl.uniform2fv(this.dropProgram.locations.ratio, ratio)

		this.drawQuad()
		this.swapBufferIndices()
	}

	private update(): void {
		const gl = this.gl
    
		gl.viewport(0, 0, this. config.resolution, this.config. resolution)
		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[this.bufferWriteIndex]!)
		this.bindTexture(this.textures[this.bufferReadIndex]!, 0)
    
		gl.useProgram(this.updateProgram.id)
		gl.uniform1f(this.updateProgram. locations.dissipation, this.config.dissipation)

		this.drawQuad()
		this.swapBufferIndices()
	}

	private render(): void {
		const gl = this.gl
    
		gl.bindFramebuffer(gl.FRAMEBUFFER, null)
		gl.viewport(0, 0, this.canvas.width, this. canvas.height)
		gl.enable(gl.BLEND)
		gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		gl.useProgram(this.renderProgram.id)
    
		this.bindTexture(this.backgroundTexture, 0)
		this.bindTexture(this.textures[0]!, 1)

		gl.uniform1f(this.renderProgram. locations.perturbance, this.config.perturbance)
		gl.uniform1i(this.renderProgram.locations.samplerBackground, 0)
		gl.uniform1i(this.renderProgram.locations. samplerRipples, 1)

		this.drawQuad()
		gl.disable(gl.BLEND)
	}

	private drawQuad(): void {
		const gl = this.gl
		gl.bindBuffer(gl.ARRAY_BUFFER, this.quad)
		gl.vertexAttribPointer(0, 2, gl. FLOAT, false, 0, 0)
		gl.drawArrays(gl.TRIANGLE_FAN, 0, 4)
	}

	private bindTexture(texture: WebGLTexture, unit: number): void {
		const gl = this.gl
		gl.activeTexture(gl. TEXTURE0 + unit)
		gl.bindTexture(gl.TEXTURE_2D, texture)
	}

	private swapBufferIndices(): void {
		this.bufferWriteIndex = 1 - this.bufferWriteIndex
		this.bufferReadIndex = 1 - this.bufferReadIndex
	}

	private lastTime = performance.now()

	private animate(): void {
		if (this.destroyed) return

		const currentTime = performance.now()
		const deltaTime = currentTime - this.lastTime
		this. lastTime = currentTime

		// Update ripples
		this.updateRipples(deltaTime)

		this.update()
		this.render()

		this.animationFrameId = requestAnimationFrame(this.animate.bind(this))
	}

	private startAnimation(): void {
		this.lastTime = performance.now()
		this.animationFrameId = requestAnimationFrame(this.animate.bind(this))
	}

	public destroy(): void {
		if (this.destroyed) return

		this.destroyed = true

		if (this.animationFrameId !== null) {
			cancelAnimationFrame(this.animationFrameId)
		}

		this.resizeObserver.disconnect()

		const gl = this.gl
    
		// Clean up WebGL resources
		this.textures.forEach(texture => gl.deleteTexture(texture))
		this.framebuffers. forEach(fb => gl.deleteFramebuffer(fb))
		gl.deleteBuffer(this.quad)
		gl.deleteTexture(this.backgroundTexture)
    
		if (this.dropProgram) gl.deleteProgram(this.dropProgram.id)
		if (this.updateProgram) gl.deleteProgram(this.updateProgram.id)
		if (this.renderProgram) gl.deleteProgram(this.renderProgram.id)
	}
}