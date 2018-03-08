var myturn = 0;
var symbol=''
var score = 0;
var socket = io()
var box = []
var currentroom = ''


// first creation of button
function choice()
{
	console.log('choice called')
	ReactDOM.render(React.createElement('form',null,React.createElement('input',{type :"submit" ,value: 'PLAY',onClick: sendplay}),React.createElement('input',{type :"submit" ,value: 'VIEW', onClick: sendview})),document.getElementById('root'))
}   
choice()
function sendplay(event)
{
	event.preventDefault()
	socket.emit('play','')
	socket.on('wait', msg => {ReactDOM.render(React.createElement('div',null,msg),document.getElementById('root'))})
	socket.on('start', msg => {start(msg)})
}

function sendview(event)
{

	event.preventDefault()
	
	socket.emit('view','')
	socket.on('playingroom',rooms=>{
	ReactDOM.render(React.createElement('form',null,rooms.map(r => React.createElement('input',{id : r ,type :"submit" ,value: `Room: ${r}`,onClick: sendroom}))),document.getElementById('rooms'))

})
}

socket.on('playingroom',rooms=>{
	ReactDOM.render(React.createElement('form',null,rooms.map(r => React.createElement('input',{id : r ,type :"submit" ,value: `Room: ${r}`,onClick: sendroom}))),document.getElementById('rooms'))})
 
socket.on('gameboard', function (box)
{

	
	ReactDOM.render(React.createElement('div',{align:'center'},React.createElement('div',null,
		box.map(x => React.createElement('div',{align:'center'},
			x.map(y => {  return React.createElement('div', {style: {display:'inline'}},React.createElement('b',null,React.createElement('button',{color:'red',size:'7'},y)))})))))
		, document.getElementById('root'))
})

function sendroom(event)
{
	event.preventDefault()
	var room = event.target.id
	document.getElementById('cur_room').innerHTML = `Viewing Room # ${room} game`
	socket.emit('selectedroom',room)
}
function takefrom_LR(row,index,pos)
{
	let myarray =[]
	if (pos=='right')
	{		
		for (var i=index ; i<box[row].length ; i++)
        {
            if(box[row][i]=='_ ')
                break;
            else
			   myarray.push(box[row][i])
        }
		return myarray
	}
	else if(pos=='left')
	{
		for (var i=index ; i>=0 ; i--)
        {
             if(box[row][i]=='_ ')
                break;
             else
			myarray.push(box[row][i])
        }
		return myarray
	}
	else if(pos=='up')
	{
		for (var i = row ; i >=0 ;i--)
        {
             if(box[i][index]=='_ ')
                break;
             else
			    myarray.push(box[i][index])
        }
		return myarray
	}
	else if(pos=='down')
	{
		for (var i = row ; i < box.length ;i++)
        {
             if(box[i][index]=='_ ')
                break;
            else
			myarray.push(box[i][index])
        }
		return myarray
	}

	else if(pos=='d_upright')
	{	var r=0
		var c=0;
		for (r = row, c=index   ; r >= 0 ;c++,r--)
        {
            if(c < box.length)
            {
                 if(box[r][c]=='_ ')
                    break;
                else
			    myarray.push(box[r][c])
            }
            else
                break;
        }
		return myarray
	}
    else if(pos=='d_downleft')
    {   
        console.log('row',row)
        console.log('col',index)
        for (var r = row, c = index   ;c >= 0 ;r++,c--)
        {
            if (r < box.length)
            {
                if(box[r][c]=='_ ')
                    break;
                else
                myarray.push(box[r][c])
            }
            else
            break;
        }
        
        return myarray
    }
    else if(pos=='d_upleft')
    {   
        for (var r = row, c = index   ; r >= 0 ;r--,c--)
        {   
            if (c>=0)
            {
                if(box[r][c]=='_ ')
                    break;
                else
                myarray.push(box[r][c])
            }
            else
                break;
        }
        return myarray
    }
    else if(pos=='d_downright')
    {   var r=0
        var c =0
      
        for (r = row, c = index   ; c < box.length ;r++,c++)
        {   if(r < box.length)
            {
                if(box[r][c]=='_ ')
                    break;
                else
                myarray.push(box[r][c])
            }
            else 
                break;
        }
        return myarray
    }
}
function highlight(id1)
{
    var count=-1
    if (isvalidpos(id1))
    {
        ReactDOM.render(React.createElement('div',null,'TURN : Your Turn (IF You Are Left With Invalid Move, Click Anywhere On Board)',React.createElement('div',null , `YOUR SYMBOL : ${symbol}`),
        box.map(x => React.createElement('div',null,
         x.map(y => { 
                count++;
                if (count.toString()!==id1 && (id1>=0 && id1<=63))
                { 
                return React.createElement('div', {style: {display:'inline'}},
                                        React.createElement('b',null,
                                       React.createElement('button',{id:count.toString(),size:'7',onClick: obj => updatebox(obj.target.id),onMouseOver:ev => highlight(ev.target.id),onMouseOut : ev=>renderclick('TURN : Your Turn (IF You Are Left With Invalid Move, Click Anywhere On Board)')},y)))
                }
                else if (count.toString()===id1)
                {
                    console.log('YEHAN')
                    return React.createElement('div', {style: {display:'inline'}},
                                        React.createElement('b',null,
                                        React.createElement('button',{id:count.toString(),onClick: obj => updatebox(obj.target.id)},React.createElement('mark',{id:count.toString(),onClick: obj => updatebox(obj.target.id),onMouseOut : ev=> renderclick('TURN : Your Turn (IF You Are Left With Invalid Move, Click Anywhere On Board)'),onMouseOver:ev => highlight(ev.target.id)},y))))
                }
            }))))
        ,document.getElementById('root'))
    }
    else 
        playagain()
}

function renderclick(string)
{
    var count = -1
        ReactDOM.render(React.createElement('div',{align:'center'},string,React.createElement('div',null , `YOUR SYMBOL : ${symbol}`),
        box.map(x => React.createElement('div',{align:'center'},
            x.map(y => { count++; return React.createElement('div', {style: {display:'inline'}},React.createElement('b',null,React.createElement('button',{id:count.toString(),onClick: obj => updatebox(obj.target.id),onMouseOver:ev => highlight(ev.target.id) , onMouseOut :ev => renderclick('TURN : Your Turn (IF You Are Left With Invalid Move, Click Anywhere On Board)')},y)))}))))
        , document.getElementById('root'))
}
function renderwithoutclick(string)
{
    var count = -1
        ReactDOM.render(React.createElement('div',{align:'center'},string,React.createElement('div',null , `YOUR SYMBOL : ${symbol}`),
        box.map(x => React.createElement('div',{align:'center'},
            x.map(y => { count++; return React.createElement('div', {style: {display:'inline'}}, React.createElement('b',null,React.createElement('button',{id:count.toString(),size:'7',onClick : obj=> alert('IT IS NOT YOUR TURN')},y)))}))))
        , document.getElementById('root'))
}
function changeturn()
{
	myturn ? myturn=0 : myturn=1
}


function playagain()
{
	!myturn ? renderwithoutclick("TURN : opponent's Turn"): renderclick('TURN : Your Turn (IF You Are Left With Invalid Move, Click Anywhere On Board)')
}


function ready(event)
{	event.preventDefault()
	socket.emit('Ready','')
}
function start(msg)
{
	//document.getElementById('join').innerHTML = msg
	ReactDOM.render(
		React.createElement('form',null,
            React.createElement('div',null,msg),
			React.createElement('input',{
			type:'submit',
			value : 'Start',
			onClick : ready}))
		,document.getElementById('root'))
}

socket.on('game', (turn,s,initialbox) => {
    box = initialbox
	symbol = s 
	//ReactDOM.render(React.createElement('b',null , `YOUR SYMBOL : ${symbol}`),document.getElementById('symbol'))
	console.log(symbol)
	myturn = turn
    playagain()
})
socket.on('Updatestate', newbox => {
	box = newbox
	changeturn();
	playagain();
 })
socket.on('invalid', ()=> playagain())
socket.on('GAMEFINISHED',msg => {
    ReactDOM.render(React.createElement('b',null,msg),document.getElementById('root'))
}) // render bna k display krna)


function updatebox(id)
{
  socket.emit('check_valid',id);
}
function isvalidpos(id)
{
    var check=0;
    
    const r = Math.floor(parseInt(id/8))    
    const c = parseInt(id%8)
    // checking right
    if(c+1<=7)
    {
    if (box[r][c]=='_ ' && box[r][c+1]!=symbol && box[r][c+1]!='_ ')
    {
        let myarray =[]
        myarray = takefrom_LR(r,c+1,'right')
        if (myarray.includes(symbol))
            check=1
    }
    }
    //checking left
    if(c-1>=0)
    {
    if (box[r][c]=='_ ' &&box[r][c-1]!=symbol && box[r][c-1]!='_ ' )
     {
        let myarray =[]
        myarray = takefrom_LR(r,c-1,'left')
        if (myarray.includes(symbol))
        check=1
     }
    }

     // up
     if(r-1>=0)
     {
     if (box[r][c]=='_ ' &&box[r-1][c]!=symbol && box[r-1][c]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r-1,c,'up')
        if (myarray.includes(symbol))
        check=1
     }
    }

     // down
     if(r+1<=7)
     {
    if (box[r][c]=='_ ' &&box[r+1][c]!=symbol && box[r+1][c]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r+1,c,'down')
        if (myarray.includes(symbol))
        check=1
     }
    }
     //diagnoly upright
        // r-1  , c+1 
        if(r-1>=0 && c+1 <=7)
        {
    if (box[r][c]=='_ ' &&box[r-1][c+1]!=symbol && box[r-1][c+1]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r-1,c+1,'d_upright')
        if (myarray.includes(symbol))
        check=1
     }
 }
     // diagnolly downleft
     if(c-1>=0 && r+1<=7)
     {
     if (box[r][c]=='_ ' &&box[r+1][c-1]!=symbol && box[r+1][c-1]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r+1,c-1,'d_downleft')
        if (myarray.includes(symbol))
        check=1
     }
 }

     //  diagnoly upleft
     if(c-1>=0 && r-1>=0)
     {
     if ( box[r][c]=='_ ' &&box[r-1][c-1]!=symbol && box[r-1][c-1]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r-1,c-1,'d_upleft')
        if (myarray.includes(symbol))
        check=1
     }
    }
     // diagnolly downright
     if(r+1<=7 && c+1 <=7)
     {
        if (box[r][c]=='_ ' &&box[r+1][c+1]!=symbol && box[r+1][c+1]!='_ ' )
        {
            let myarray =[]
            myarray = takefrom_LR(r+1,c+1,'d_downright')
            if (myarray.includes(symbol))
            check=1
        }
    }
    if (check)
    {
        return true;
    }
    return false;

}