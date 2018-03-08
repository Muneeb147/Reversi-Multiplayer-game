const fs = require('fs');
const http = require ('http')
const socketio = require('socket.io')
var waiting = []
var gameroom = "1";
var roomcount=1;
let roomslist = []
let viewers =[]
// sending msg to all clients 
let array ={}
function boxfull(box)
{
    let c = 0
    box.forEach(b => {
        if(b.includes('_ '))
        {
            c= 1
        }
    })
    if (c)
        return false;
    else
        return true;
}


const readFile = (filename) => new Promise ((resolve,reject) => 
		fs.readFile(filename,'utf8',(err,data) => err ? reject(err) : resolve((data))))

var port = process.argv[2]
console.log(port);
const server = http.createServer((req,res) => {
			readFile(req.url.substr(1)).then((data) => {res.end(data);}).catch(err=> console.log(err))			
			}).on('error',()=> console.log('error'))

var io = socketio(server)
server.listen(port,'0.0.0.0')
function makebox()
{
var box = []
num = [0,1,2,3,4,5,6,7]
for (var i in num)
	box[i]=['_ ', '_ ','_ ','_ ','_ ','_ ','_ ','_ ']

box[3][3] = '0 '
box[3][4] ='x '
box[4][3] = 'x '
box[4][4] = '0 '
return box
}



io.sockets.on('connection',function (socket){

console.log('someone connected')
socket.on('play', function()
{

	if(!waiting.length)
	{
		socket.join(gameroom)
       
		socket.emit('wait',`Joined in Room# ${gameroom}, waiting for other player to connect`);
		socket.room = gameroom;
		waiting.push(socket);
		roomcount+=1
		gameroom = roomcount.toString()
	}
	else
	{
		let player = waiting.pop();
		socket.join(player.room);
         roomslist.push(player.room);
		socket.symbol = '0 '
		player.symbol = 'x '
		socket.box = makebox()
		player.box = makebox()
		io.sockets.in(player.room).emit('start',`The player found in your Room# ${player.room}, begin the game`);
		socket.room = player.room;
		array[socket.room] = [socket,player,0,[]];

		
		checkbothplayersready(socket,player)
		socket.on('check_valid', id => update_valid(id,socket))
		player.on('check_valid', id => update_valid(id,player))

		
    }
})

socket.on('view' , function() {
    viewers.push(socket)
    socket.emit('playingroom',roomslist)
})
socket.on('selectedroom',function(room)
    {
        array[room][3].push(socket)
        socket.emit('gameboard',array[room][0].box)
    })

})


function checkbothplayersready(socket,player)
{
	    player.on('Ready', ()=>{
			socket.on('Ready',()=>{
				socket.emit(player.room).emit('game',0,'0 ',socket.box)
				player.emit(player.room).emit('game',1,'x ',socket.box)
                //viewers.forEach( v=> v.emit('playingroom',viewers))
            })
		})
		socket.on('Ready', ()=>{
			player.on('Ready',()=>{
				socket.emit(player.room).emit('game',0,'0 ',socket.box)
				player.emit(player.room).emit('game',1,'x ',socket.box)
                //viewers.forEach( v=> v.emit('playingroom',viewers))
                 })			
		})
}

function update_valid(id,soc)
{
	console.log('yehan update meaya');
	const r = Math.floor((id/8))    
    const c = (id%8)
	if(isvalid(id,soc,0))
	{
        array[soc.room][2]=0
        console.log('yehan isvalid k true hony pr aya')
		soc.box[r][c] = soc.symbol;
		array[soc.room][0].box = soc.box;
		array[soc.room][1].box = soc.box;
		 if(boxfull(soc.box)) 
	       	gameend(soc)
		 else
        {
            if(array[soc.room][3].length!=0)
            {
                    io.sockets.in(soc.room).emit('Updatestate',soc.box)
                    array[soc.room][3].forEach(a=> a.emit('gameboard',soc.box))   
            }
            else
            {
                io.sockets.in(soc.room).emit('Updatestate',soc.box)
            }
        }
	}
	 else if(checknovalidturn(soc)) 
	   {  

        console.log('yehan bhii aya')
       array[soc.room][2]++;
        if (boxfull(soc.box) || array[soc.room][2]==2 )
        {
            gameend(soc)
        }
        else
        {
            if(array[soc.room][3].length!=0)
            {
                    io.sockets.in(soc.room).emit('Updatestate',soc.box)
                    array[soc.room][3].forEach(a=> a.emit('gameboard',soc.box))
            }
            else
            {
                io.sockets.in(soc.room).emit('Updatestate',soc.box)
            }
	 } 
		
	}
	else
    {
        array[soc.room][2]=0
        console.log('yehan tww aya')
		soc.emit('invalid','')
    }

}

function checknovalidturn (soc)
{

    let c= 1;
	for (let i = 0 ; i<64;i++)
	{
        const r = Math.floor((i/8))
        const col = (i%8)
        if (soc.box[r][col] =='_ ')
		  {
            if (isvalid(i,soc,1))
			     return false
          }
	}
   return true
	
}
function gameend(soc)
{
	winningplayer(soc)
	io.sockets.in(soc.room).emit('GAMEFINISHED',`Player with Symbol : "${winnersymbol}" has WON`)
    if (array[soc.room][3].length)
        array[soc.room][3].forEach(v => v.emit('GAMEFINISHED',`Player with Symbol : "${winnersymbol}" has WON`))
}

function winningplayer(soc)
{
	var count0=0
	var countX=0
	soc.box.forEach(b => {
		b.forEach(c => {
			c==='x '? countX++ : count0++
		})
	})
	winnersymbol = (count0 > countX) ? '0 ' :'x '  

}
function isvalid(id,soc,opt)
{

	var symbol = soc.symbol
    const r = Math.floor((id/8))    
    const c = (id%8)
    //console.log('inside_invalid',soc.box)

    if (soc.box[r][c] != '_ ')
        return false
    else
    {
	var check=0;
	const r = Math.floor((id/8))	
    const c = (id%8)
    // checking right
    if(c+1<=7)
    {
    if (soc.box[r][c+1]!=symbol && soc.box[r][c+1]!='_ ')
    {
        let myarray =[]
    	myarray = takefrom_LR(r,c+1,'right',soc)
    	if (myarray.includes(symbol))
    	{
            if(opt)
                return true;
    		check=1
    		for (var i = c+1;i < soc.box[r].length ;i++)
    		{
                if (soc.box[r][i]==symbol)
                    break;
    			else if(soc.box[r][i]!='_ ')
    				soc.box[r][i] = symbol
    		}
    	}
        
    }
    }
    //checking left
    if(c-1 >=0)
    {
    if (soc.box[r][c-1]!=symbol && soc.box[r][c-1]!='_ ' )
     {
        
     	let myarray =[]
     	myarray = takefrom_LR(r,c-1,'left',soc)
     	if (myarray.includes(symbol))
     	{
            if(opt)
                return true;
     		check=1
     		for (var i = c-1;i >=0 ;i--)
     		{
                if (soc.box[r][i]==symbol)
                    break;
     			else if(soc.box[r][i]!='_ ')
           			soc.box[r][i] = symbol
     		}
     	}
     }
    }

     // up
     if(r-1>=0)
     {
     if (soc.box[r-1][c]!=symbol && soc.box[r-1][c]!='_ ')
     {
        
     	let myarray =[]
     	myarray = takefrom_LR(r-1,c,'up',soc)
     	if (myarray.includes(symbol))
     	{
            if(opt)
                return true;
     		check=1
            checku=1
            for (var i = r-1;i >=0 ;i--)
     		{
                if (soc.box[i][c]==symbol)
                    break;
     			else if(soc.box[i][c]!='_ ')
           			soc.box[i][c] = symbol
     		}
     	}
     }
    }

     // down
     if(r+1<=7)
     {
    if (soc.box[r+1][c]!=symbol && soc.box[r+1][c]!='_ ')
     {
         
     	let myarray =[]
     	myarray = takefrom_LR(r+1,c,'down',soc)
     	if (myarray.includes(symbol))
     	{
            if(opt)
                return true;
     		check=1
            checkd=1
             
     		for (var i = r+1;i < soc.box.length ;i++)
     		{
                if (soc.box[i][c]==symbol)
                    break;
     			if(soc.box[i][c]!='_ ')
           			soc.box[i][c] = symbol
     		}
     	}
     }
    }
     //diagnoly upright
     	// r-1  , c+1 
        if(r-1>=0 && c+1 <=7)
        {
    if (soc.box[r-1][c+1]!=symbol && soc.box[r-1][c+1]!='_ ')
     {
     	let myarray =[]
     	myarray = takefrom_LR(r-1,c+1,'d_upright',soc)
     	if (myarray.includes(symbol))
     	{
            if(opt)
                return true;
     		check=1
            checkur=1
             
     		for (var i = r-1 , j=c+1; i >=0 ;i--,j++)
     		{
                if (j < soc.box.length)
                {
                    if (soc.box[i][j]==symbol)
                    break;
     			    if(soc.box[i][j]!='_ ')
           			  soc.box[i][j] = symbol
                }
     		}
     	}
     }
    }
     // diagnolly downleft
     if(c-1>=0 && r+1<=7)
     {
     if (soc.box[r+1][c-1]!=symbol && soc.box[r+1][c-1]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r+1,c-1,'d_downleft',soc)
        
        if (myarray.includes(symbol))
        {
            if(opt)
                return true;
            check=1
            checkdl=1
             
            for (var i = r+1 , j=c-1; j >=0 ;i++,j--)
            {
                if (i < soc.box.length)
                {
                    if (soc.box[i][j]==symbol)
                    break;
                    if(soc.box[i][j]!='_ ')
                        soc.box[i][j] = symbol
                }
            }
        }
     }
 }

     //  diagnoly upleft
     if(c-1>=0 && r-1>=0)
     {
     if ( soc.box[r-1][c-1]!=symbol && soc.box[r-1][c-1]!='_ ')
     {
        let myarray =[]
        myarray = takefrom_LR(r-1,c-1,'d_upleft',soc)
        if (myarray.includes(symbol))
        {
            if(opt)
                return true;
            check=1
            checkul=1
             
            for (var i = r-1 , j= c-1; j >=0 ;i--,j--)
            {
                if (i>=0)
                {
                    if (soc.box[i][j]==symbol)
                    break;
                    if(soc.box[i][j]!='_ ')
                        soc.box[i][j] = symbol
                }
            }
        }
        
     }
    }

     // diagnolly downright
     if(r+1<=7 && c+1 <=7)
     {
        if (soc.box[r+1][c+1]!=symbol && soc.box[r+1][c+1]!='_ ' )
        {
            let myarray =[]
            myarray = takefrom_LR(r+1,c+1,'d_downright',soc)
            if (myarray.includes(symbol))
            {
                if(opt)
                return true;
                check=1
                checkdr = 1
                 
                for (var i = r+1 , j = c+1; j <soc.box.length; i++, j++)
                {   if(i<soc.box.length)
                    {
                        if (soc.box[i][j]==symbol)
                            break;
                        if(soc.box[i][j]!='_ ')
                            soc.box[i][j] = symbol
                    }
                }
            }
            
        }
    }
    if (check)
    {
        return true;
    }
    return false;
}
}

function takefrom_LR(row,index,pos,soc)
{
	let myarray =[]
	if (pos=='right')
	{		
		for (var i=index ; i<8 ; i++)
        {
            if(soc.box[row][i]=='_ ')
                break;
            else
			   myarray.push(soc.box[row][i])
        }
		return myarray
	}
	else if(pos=='left')
	{
		for (var i=index ; i>=0 ; i--)
        {
             if(soc.box[row][i]=='_ ')
                break;
             else
			myarray.push(soc.box[row][i])
        }
		return myarray
	}
	else if(pos=='up')
	{
		for (var i = row ; i >=0 ;i--)
        {
             if(soc.box[i][index]=='_ ')
                break;
             else
			    myarray.push(soc.box[i][index])
        }
		return myarray
	}
	else if(pos=='down')
	{
		for (var i = row ; i < 8 ;i++)
        {
             if(soc.box[i][index]=='_ ')
                break;
            else
			myarray.push(soc.box[i][index])
        }
		return myarray
	}

	else if(pos=='d_upright')
	{	var r=0
		var c=0;
		for (r = row, c=index   ; r >= 0 ;c++,r--)
        {
            if(c < 8)
            {
                 if(soc.box[r][c]=='_ ')
                    break;
                else
			    myarray.push(soc.box[r][c])
            }
            else
                break;
        }
		return myarray
	}
    else if(pos=='d_downleft')
    {   
        for (var r = row, c = index   ;c >= 0 ;r++,c--)
        {
            if (r < 8)
            {
                if(soc.box[r][c]=='_ ')
                    break;
                else
                myarray.push(soc.box[r][c])
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
                if(soc.box[r][c]=='_ ')
                    break;
                else
                myarray.push(soc.box[r][c])
            }
            else
                break;
        }
        return myarray
    }
    else if(pos=='d_downright')
    {   var r=0
        var c =0
      
        for (r = row, c = index   ; c <8 ;r++,c++)
        {   if(r < 8)
            {
                if(soc.box[r][c]=='_ ')
                    break;
                else
                myarray.push(soc.box[r][c])
            }
            else 
                break;
        }
        return myarray
    }
}