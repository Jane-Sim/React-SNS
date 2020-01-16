//obj 모델을 보여줄 수 있도록 three 라이브러리로 렌더링 화면을 그려주는 js입니다.
//사용자는 자신이 올린 모델을 홈페이지에 보여줄 수 있고,
//다른 사용자들도 보며, 모델을 회전시켜 자세히 볼 수 있습니다.

import React, {Component} from 'react'
import { Button, Label}from 'reactstrap'
import request from 'superagent'
import {Redirect} from 'react-router-dom'
import styles from './styles'
//three.js에 필요한 모듈을 가져옵니다.
import './js/three'
import './js/loaders/OBJLoader' //obj를 불러올 로더
import './js/loaders/MTLLoader' //mtl을 불러올 로더
import './js/loaders/DDSLoader' //dds를 불러올 로더
import './js/controls/TrackballControls' //해당 모델의 화면을 마우스로 회전시켜 볼 수 있게 하는 컨트롤러

export default class Showobj extends Component {
    constructor (props) {
        super(props)
        this.state = { download: '' }
    }
    //리액트가 DOM을 생성한 뒤에 실행시키는 componentDidMount입니다.
    //생성된 mount div를 불러와, 해당 div안에 3D모델 화면을 캔버스로 그려넣습니다.
    componentDidMount(){
        this.start = this.start.bind(this)      //해당 렌더링을 할 수 있도록 start함수를 연결한다
        this.stop = this.stop.bind(this)        //렌더링을 멈추게 하는 stop 함수를 연결한다.
        this.animate = this.animate.bind(this)  //해당 three에서 변경되는 값을 업데이트 해주는 역할.
        this.THREE = THREE

        const windowHalfX = this.mount.clientWidth  //mount의 width와 height값을 가져와, 카메라 크기를 맞춘다.
        const windowHalfY = this.mount.clientHeight

        const camera = new this.THREE.PerspectiveCamera( 100, windowHalfX / windowHalfY, 0.1, 1000 )
        camera.position.z = 250                     //카메라를 멀리 비춘다.

        const scene = new this.THREE.Scene()       //오브젝트나, 조명 카메라 등 여러가지를 볼 수 있도록 하는 scene.
        const ambientLight = new this.THREE.AmbientLight( 0xcccccc, 0.4 )  //오브젝트에 빛비춤 효과를 위한 조명.
        scene.add( ambientLight )
        const pointLight = new this.THREE.PointLight( 0xffffff, 0.8 )
        camera.add( pointLight )                   //카메라 각도가 바뀌어도 한 곳에서만 빛을 비추도록 하는 조명.
        scene.add( camera )                        //마지막에 카메라도 scene에 추가한다.
        //오브젝트를 다운로드하는 걸 로그로 표시한다.
        const onProgress = ( xhr ) => {
            if ( xhr.lengthComputable ) {
                var percentComplete = xhr.loaded / xhr.total * 100
                console.log( Math.round( percentComplete, 2 ) + '% downloaded' )
                var downpercent = Math.round( percentComplete, 2 ) + '% downloaded'
                this.setState({download: downpercent})  //사용자가 object를 다운과정을 볼 수 있게 만든다.
            }
        }
        const onError = ( xhr ) => { }
        //obj와 mtl을 불러오는 loader들을 사용한다.
        this.THREE.Loader.Handlers.add( /\.dds$/i, new this.THREE.DDSLoader() )
        const mtlLoader = new this.THREE.MTLLoader()
            mtlLoader.load( 'models/'+this.props.mtl, materials => {
                materials.preload()
                const objLoader = new this.THREE.OBJLoader()
                 objLoader.setMaterials( materials )
                objLoader.load( 'models/'+this.props.obj, object => {
                    object.position.y = - 95
                    scene.add( object ) //불러온 obj를 scene에 넣는다.
                }, onProgress, onError )
            } )
        //화면에 해당 모델들을 보여주게 만드는 렌더러다
        const renderer = new this.THREE.WebGLRenderer({antialias: true})
        renderer.setSize( windowHalfX, windowHalfY )

        this.scene = scene
        this.camera = camera
        this.renderer = renderer
        this.windowHalfX = windowHalfX
        this.windowHalfY = windowHalfY
        this.controls = new this.THREE.TrackballControls( this.camera )
        this.controls.enabled  = false          //처음에는 사용자가 마우스 컨트롤을 못하게 설정한다.
        this.mount.appendChild( this.renderer.domElement )
        window.addEventListener( 'resize', this.onWindowResize(), false )   //사용자의 화면 해상도에 따라 하면을 조절한다.

        this.start()
    }
    //시작하면 모델들을 보여준다.
    start() {
        if (!this.frameId) {
            this.frameId = requestAnimationFrame(this.animate)
        }
    }
    //div가 없어지면 모델도 지운다
    componentWillUnmount() {
        this.stop()
        this.mount.removeChild(this.renderer.domElement)
    }
    stop() {
        cancelAnimationFrame(this.frameId)
    }
    onWindowResize() {
        this.camera.aspect = this.windowHalfX / this.windowHalfY
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(this.windowHalfX, this.windowHalfY )
    }
    animate() {
        this.controls.update()
        this.rendering()
        this.frameId =  window.requestAnimationFrame(this.animate)
    }
    rendering() {
        this.camera.lookAt( this.scene.position )
        this.renderer.render( this.scene, this.camera )
    }

    render () {
        return (
            <div ref={(mount) => { this.mount = mount }}
                 style={styles.under}
            className="container">
                <Button style={{marginRight:'3px'}} onClick={e => this.controls.enabled  = true}>마우스로 움직이기</Button>
                <Button onClick={e => this.controls.enabled  = false}>멈추기</Button>
                <Label>{this.state.download}</Label>
            </div>
        )

    }
}
