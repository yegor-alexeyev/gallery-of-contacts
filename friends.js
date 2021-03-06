


var alpha = 360
  , pi = Math.PI
  , t = 50;

function draw() {

var loader = document.getElementById('loader')
  , border = document.getElementById('border')
  if (loader) {

    alpha -= 4;
    alpha %= 360;
    var r = ( alpha * pi / 180 )
      , x = Math.sin( r ) * 50
      , y = Math.cos( r ) * - 50
      , mid = ( alpha > 180 ) ? 1 : 0
      , anim = 'M 0 0 v -50 A 50 50 1 ' 
             + mid + ' 1 ' 
             +  x  + ' ' 
             +  y  + ' z';
   
    loader.setAttribute( 'd', anim );
    border.setAttribute( 'd', anim );
    
    setTimeout(draw, t); // Redraw
  }
};



setTimeout( function() {
}, 500);

function get_contact_url( uid) {
	return "//vkontakte.ru/id" + uid;
}

var vk_loader = new contact_loader();



var friends_getMutual_traits = {"method_name" : "execute", "parameters_builder" : function(details_requests) {
		var code = "var ret = [";
		for (var i = 0; i < details_requests.length; i++) {
			if (i!=0) {
				code += ",";
			}
			code += "API.friends.getMutual({target_uid:" + details_requests[i].parameters.contact_1.uid
								+ ", source_uid: " + details_requests[i].parameters.contact_2.uid + "})";
		}				
		code += "]; return ret;";
		return {api_id:"1918079",code:code,v:"3.0"};			
	}
	,"response_handler" : function(parameters,response) {
		if (!parameters.contact_1.mutual_friends) {
			parameters.contact_1.mutual_friends = {};
		}
		if (!parameters.contact_2.mutual_friends) {
			parameters.contact_2.mutual_friends = {};
		}
		if (response.constructor != Array) {
			response = [];
		}
		for (var uid_index = 0;uid_index < response.length;uid_index++) {
			var mutual_friend_uid = response[uid_index];
			if (!parameters.contact_1.mutual_friends[parameters.contact_2.uid]) {
				parameters.contact_1.mutual_friends[parameters.contact_2.uid] = [];
			}
			if (index_of(parameters.contact_1.mutual_friends[parameters.contact_2.uid]
					,mutual_friend_uid) == -1) {
				parameters.contact_1.mutual_friends[parameters.contact_2.uid].push(mutual_friend_uid);					
			}
			if (!parameters.contact_1.mutual_friends[mutual_friend_uid]) {
				parameters.contact_1.mutual_friends[mutual_friend_uid] = [];
			}
			if (index_of(parameters.contact_1.mutual_friends[mutual_friend_uid]
					,parameters.contact_2.uid) == -1) {
				parameters.contact_1.mutual_friends[mutual_friend_uid].push(parameters.contact_2.uid);					
			}
			
		}
	}
	,"max_sum" : 25};


var call_counter = 0;
var l = -1;
var clusters = new Array();


function get_app_user_uid()	{
//return 5843475;
//return 14769060;
//return 3469711;
//return 1895846;
//return 4430857;

	return Number(getUrlParameter(window.location.href, "viewer_id")); 
}


function indexOf(arr, pred) {
	var index = 0;
	while (index < arr.length && !pred(arr[index])) {
		index++;
	}
	if (index == arr.length) {
		return -1;
	}
	return index;
}

function uids_are_friends(user, uid1, uid2) {
// Contacts can hide their friends information, so we will check both of them
				
	return user.mutual_friends 
	&& (user.mutual_friends[uid1] 
	&& index_of(user.mutual_friends[uid1],uid2) != -1 
	|| user.mutual_friends[uid2] && index_of(user.mutual_friends[uid2],uid1) != -1);
}


function find_distinct_values(uids1,uids2) {
	//we assume groups members are sorted
	
	var distinct_values = new Array();
	
	var index1 = 0;
	var index2 = 0;
	while (index1 < uids1.length || index2 < uids2.length) {
		if (index1>=uids1.length) {
			distinct_values.push(uids2[index2]);
			index2++;
		} else {
			if (index2>=uids2.length) {
				distinct_values.push(uids1[index1]);
				index1++;
			} else { 
				if (uids1[index1] < uids2[index2]) {
					distinct_values.push(uids1[index1]);
					index1++;
				} else {
					if (uids1[index1] > uids2[index2]) {
						distinct_values.push(uids2[index2]);
						index2++;
					} else {
						if (uids1[index1] == uids2[index2]) {
							index1++;
							index2++;
						}
					}
				}
			}
		}
	
	}
	
	return distinct_values;
}


function merge_unique(uids1, uids2) {
	//we assume groups members are sorted
	
	var uniques = new Array();
	
	var index1 = 0;
	var index2 = 0;
	while (index1 < uids1.length || index2 < uids2.length) {
		var next_uid;
		if (index1 < uids1.length && (index2 >= uids2.length || uids1[index1] < uids2[index2])) {
			next_uid = uids1[index1];
			index1++;
		} else {
			next_uid = uids2[index2];
			index2++;
		}
		if (uniques.length == 0 || uniques[uniques.length - 1]!=next_uid) {
			uniques.push(next_uid);
		}
	}
	
	return uniques;
}

function concat_members_names(members) {
	var group_name = "";
	for (var n = 0; n < members.length; n++) {
		group_name = group_name + members[n].first_name + (n == (members.length - 1) ? "" : " ");
	}
	return group_name;
}
function merge_to_next_size(user,groups){
	var groups_of_next_size = {};
	for (var index1=0;index1<groups.length;index1++){
		var group1 = groups[index1];
		for (var index2=index1+1;index2<groups.length;index2++){
			var group2 = groups[index2];
			var distinct_values = find_distinct_values(group1.uids,group2.uids);
			if (distinct_values.length==2 && uids_are_friends(user,distinct_values[0],distinct_values[1])){
				group1.used_in_merged = true;
				group2.used_in_merged = true;
				var uids = merge_unique(group1.uids,group2.uids);
				var group_of_next_size = new Object({uids:uids,used_in_merged:false});
				
				groups_of_next_size[uids] = group_of_next_size;
			}
		}
	}
	var groups_array = new Array();
	for (var group_key in groups_of_next_size) {
		groups_array.push(groups_of_next_size[group_key]);
	}
	return groups_array;
}


function index_of_same_group(groups,group_1) {
	return indexOf(groups,function(group) {
			if (group_1.uids.length !=group.uids.length){
				return false;
			}
			for (var member_index=0;member_index<group.uids.length;member_index++) {
				if (group_1.uids[member_index]!=group.uids[member_index]){
					return false;
				}
			}
			return true;
		});
}
	
function merge_groups(user,group_size_begin,group_size_end,groups_for_merge) {
	var all_merged_groups = new Array();
	for (var i=group_size_begin;i<=group_size_end;i++) {
		var tmp_groups_for_merge = merge_to_next_size(user,groups_for_merge);
		for (var j = 0; j < groups_for_merge.length;j++) {
			if (!groups_for_merge[j].used_in_merged) {
				all_merged_groups.push(groups_for_merge[j]);
			}
		}
		groups_for_merge = tmp_groups_for_merge;
	}	
	for (var i = 0; i < groups_for_merge.length;i++) {
		all_merged_groups.push(groups_for_merge[i]);
	}
	return all_merged_groups;
}
	

	
function find_dublicates_in_sorted_arrays(array_1,array_2,comparator) {
	var dublicates = new Array();
	var index_1 = 0;
	var index_2 = 0;
	while (index_1 < array_1.length && index_2 < array_2.length) {
		var compare_result = comparator(array_1[index_1],array_2[index_2]);
		if (compare_result == 0) {
			dublicates.push(array_1[index_1]);
			index_1++;
			index_2++;
		}
		else {
			if (compare_result < 0) {
				index_1++;
			}
			else {
				index_2++;
			}
		}
	}
	return dublicates;
}
	
	
function find_triples(user) {
	var groups_3 = new Array();
	
	for (var uid_of_friend_of_user  in user.friends){
		var mutual_friends = user.mutual_friends[uid_of_friend_of_user];
		if (mutual_friends) {
			for (var i = 0; i < mutual_friends.length; i++) {
				var triple = new Array();
				triple.push(user.uid);
				triple.push(Number(uid_of_friend_of_user));
				triple.push(mutual_friends[i]);
				triple.sort(function(uid_1,uid_2) { return uid_1 - uid_2;});				

				var group = new Object({uids: triple,used_in_merged:false});
				if (index_of_same_group(groups_3,group)==-1) {
					groups_3.push(group);
				}				
			}
		}
	}
	return groups_3;
}
	
function get_distinct_uids(groups){
	var uids = {};
	for (var i = 0; i<groups.length;i++) {
		for (var j = 0;j<groups[i].uids.length;j++) {
			var uid = groups[i].uids[j];
			uids[uid] = true;
		}
	}
	return uids;
}

function get_intersected_array(array_1,array_2) {
	
	var array_1_as_object = {};
	for (var element_index = 0; element_index < array_1.length;element_index++) {
		array_1_as_object[array_1[element_index]] = true;
	}
	
	var result = [];
	
	for (var element_index=0;element_index<array_2.length;element_index++) {
		var element = array_2[element_index];
		if (array_1_as_object[element]) {
			result.push(element);
		}
	}
	return result;
}


function get_substracted_array(substractable,substraction) {
	
	var substractable_as_object = {};
	for (var element_index = 0; element_index < substractable.length;element_index++) {
		substractable_as_object[substractable[element_index]] = true;
	}
	for (var element_index=0;element_index<substraction.length;element_index++) {
		delete substractable_as_object[substraction[element_index]];
	}
	var substracted_array = [];
	for (var element in substractable_as_object) {
		substracted_array.push(element);
	}
	substracted_array.sort(function(element_1,element_2) { return element_1 - element_2;});
	return substracted_array;
}


function get_common_uids(groups,group_indexes) {
	var common_uids = [];
	if (group_indexes.length >= 2) {
		common_uids = groups[group_indexes[0]].uids;
		for (var group_indexes_index = 1; group_indexes_index < group_indexes.length; group_indexes_index++) {
			common_uids = find_dublicates_in_sorted_arrays(common_uids,groups[group_indexes[group_indexes_index]].uids
				, function(uid_1,uid_2) { return uid_1 - uid_2;});
		}
	}
	return common_uids;
}

var drawCommandIssued = false;

function check_draw_grid_of_friends(user) {
  if (!drawCommandIssued) {
     var elemBorder = document.getElementById('border');
     elemBorder.parentNode.removeChild(elemBorder);
     var elemLoader = document.getElementById('loader');
     elemLoader.parentNode.removeChild(elemLoader);
     var elemNotice = document.getElementById('notice');
     elemNotice.parentNode.removeChild(elemNotice);

     draw_grid_of_friends(user);

     drawCommandIssued = true;
  }
}



function process_output(user) {
	if (user.mutual_friends) {
		var groups_3 = find_triples(user);
		var groups = merge_groups(user, 4,11,groups_3);
		
		//var uids = get_distinct_uids(groups);
    check_draw_grid_of_friends(user);
	}
}

function delete_value_in_grid(grid,index) {
	if (grid[index[0]]) {
		delete grid[index[0]][index[1]];
		var count_of_indexes;
		for (var indexes in grid[index[0]]) {
			count_of_indexes++;
		}
		if (count_of_indexes == 0) {
			delete grid[index[0]];
		}
	}
}

function get_index_in_grid(grid,value) {
//may be optimized	
	var index = undefined;
	for_each_index_in_grid(grid,function(current_index) {		
		if (get_value_in_grid(grid,current_index) == value) {

			index = current_index;
		}
	});
	return index;
}

function get_value_in_grid(grid, index) {
	if (grid[index[0]]) {
		return grid[index[0]][index[1]];		
	}
	else {
		return undefined;
	}
}

function set_value_in_grid(grid,index,value) {
	if (!grid[index[0]]) {
		grid[index[0]] = [];
	}
	grid[index[0]][index[1]] = value;	
}

function for_each_index_in_grid(grid,callback) {
	for (var grid_index_x in grid) {
		for (var grid_index_y in grid[grid_index_x]) {
			callback([Number(grid_index_x),Number(grid_index_y)]);
		}
	}
}

function get_sorted_values_in_grid(grid) {
	var values = [];
	for_each_index_in_grid(grid,function(index) {
		values.push(get_value_in_grid(grid,index));
	});
	values.sort(function(index_1,index_2) {
		return index_2 - index_1;
	});
	return values;
}

function add_mutual_friends_recursively(user,uid,list,excludes) {
  if (user.mutual_friends) {
    var mutual_friends = user.mutual_friends[uid];
    if (mutual_friends) {
      for (var i = 0; i < mutual_friends.length; i++) {
        var mutual_friend_uid = mutual_friends[i];
        if (!excludes[mutual_friend_uid]) {
          list.push(mutual_friend_uid);
          excludes[mutual_friend_uid] = true;
          add_mutual_friends_recursively(user,mutual_friend_uid,list,excludes);
        }
      }
    }
  }
}

function create_grid_of_friends(user,group, maximum_width) {
	var grid = {};
	for (var i = 0; i < group.length; i++) {
		var friend_uid = group[i];
		var indexes_of_placed_contacts = [];
    if (user.mutual_friends) {
      var mutual_friends = user.mutual_friends[friend_uid];
      if (mutual_friends) {
        for (var j = 0; j < mutual_friends.length; j++) {
          var uid_of_mutual_friend = mutual_friends[j];
          var index_of_mutual_friend = get_index_in_grid(grid,uid_of_mutual_friend);

          if (index_of_mutual_friend) {
            indexes_of_placed_contacts.push(index_of_mutual_friend);
          }						
        }			
      }

    }

    var middle_coordinate = get_middle_coordinate(indexes_of_placed_contacts);
    var index_of_friend = get_nearest_free_index(grid,middle_coordinate, maximum_width);		
    set_value_in_grid(grid,index_of_friend, friend_uid);		
	}
	return grid;
}

function get_shifted_grid(grid,lower_bound) {

	var shifted_grid = {};
	var bounds = find_bounding_indexes(grid);
	var horizontal_shift = lower_bound[0] - bounds[0][0];
	var vertical_shift = lower_bound[1] - bounds[0][1];
	
	for_each_index_in_grid(grid, function(grid_index) {
		var shifted_index = [grid_index[0] + horizontal_shift
                             ,grid_index[1] + vertical_shift];
		var value = get_value_in_grid(grid,grid_index);
		set_value_in_grid(shifted_grid,shifted_index,value);
	});
	return shifted_grid;
}

function get_bounds_of_area(area) {
	var area_bounds = [[Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY] 
						,[Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY]];
	for (var i = 0; i < area.length; i++) {
		var bounds = area[i];

		if (bounds[0][0] < area_bounds[0][0]) {
			area_bounds[0][0] = bounds[0][0];
		}
		if (bounds[0][1] < area_bounds[0][1]) {
			area_bounds[0][1] = bounds[0][1];
		}
		if (bounds[1][0] > area_bounds[1][0]) {
			area_bounds[1][0] = bounds[1][0];
		}
		if (bounds[1][1] > area_bounds[1][1]) {
			area_bounds[1][1] = bounds[1][1];
		}
	}
	return area_bounds;
}

function ranges_are_intersected(range_1, range_2) {
	return range_1[1] >= range_2[0] && range_1[0] < range_2[1];
}

function bounds_are_intersected(bounds_1, bounds_2) {
	return ranges_are_intersected([bounds_1[0][0], bounds_1[1][0]], [bounds_2[0][0], bounds_2[1][0]])
		&& ranges_are_intersected([bounds_1[0][1], bounds_1[1][1]], [bounds_2[0][1], bounds_2[1][1]]);
}

function bounds_intersect_area(bounds, area, delta) {
	for (var i=0; i < area.length; i++) {
		var area_bounds = [[area[i][0][0] - delta, area[i][0][1] - delta]
						,[area[i][1][0] + delta, area[i][1][1] + delta]];
		if (bounds_are_intersected(bounds, area_bounds)) {
			return true;
		}
	}
	return false;	
}


function get_lower_bound_for_grid(grids_positions,dimensions_of_grid,maximum_width,delta) {
	if (grids_positions.length == 0) {
		return [delta,delta];
	}
	
	for (var i = 0; i < grids_positions.length; i++) {
		var lower_bound = [grids_positions[i][1][0] + delta, grids_positions[i][0][1]];
		var upper_bound = [lower_bound[0] + dimensions_of_grid[0], lower_bound[1] + dimensions_of_grid[1]];
		if (upper_bound[0] <= maximum_width) {
			if (!bounds_intersect_area([lower_bound, upper_bound], grids_positions, delta)) {
				return lower_bound;
			}
		}
	}

	for (var i = 0; i < grids_positions.length; i++) {
		var lower_bound = [grids_positions[i][0][0], grids_positions[i][1][1] + delta];
		var upper_bound = [lower_bound[0] + dimensions_of_grid[0], lower_bound[1] + dimensions_of_grid[1]];
		if (upper_bound[0] <= maximum_width) {
			if (!bounds_intersect_area([lower_bound, upper_bound], grids_positions, delta)) {
				return lower_bound;				
			}
		}
	}
	
	for (var i = 0; i < grids_positions.length; i++) {
		var lower_bound = [grids_positions[i][1][0] + delta, grids_positions[i][1][1] + delta];
		var upper_bound = [lower_bound[0] + dimensions_of_grid[0], lower_bound[1] + dimensions_of_grid[1]];
		if (upper_bound[0] <= maximum_width) {
			if (!bounds_intersect_area([lower_bound, upper_bound], grids_positions, delta)) {
				return lower_bound;				
			}
		}
	}

	
	return [get_bounds_of_area(grids_positions)[1][0] + delta
	        ,get_bounds_of_area(grids_positions)[1][1] + delta];
	
}

function draw_grid_of_friends(user) {

	var width_of_window = 606;
	
	var width_of_cell = 50;
	var width_of_border = 5;
	
	var grids = [];
	var excludes = {};
	for (var uid_string in user.friends) {
		var uid = Number(uid_string);
		if (!excludes[uid]) {
			excludes[uid] = true;
			var group = [uid];
			add_mutual_friends_recursively(user,uid,group,excludes);
			group.sort(function(friend_1,friend_2) {
				var counter_1 = user.mutual_friends[friend_1] ? user.mutual_friends[friend_1].length : 0;
				var counter_2 = user.mutual_friends[friend_2] ? user.mutual_friends[friend_2].length : 0;
				var delta_between_counters = counter_2 - counter_1;
				return delta_between_counters != 0 ? delta_between_counters : friend_2 - friend_1;
			});
			grids.push(get_shifted_grid(create_grid_of_friends(user,group, width_of_window/(width_of_cell + 1.5*width_of_border)),[0,0]));
		}
	}
	
	grids.sort(function(grid_1, grid_2) {
		var bounds_of_grid_1 = get_bounds_of_grid(grid_1);
		var dimensions_of_grid_1 = [bounds_of_grid_1[1][0] - bounds_of_grid_1[0][0]
		,bounds_of_grid_1[1][1] - bounds_of_grid_1[0][1]];
		var bounds_of_grid_2 = get_bounds_of_grid(grid_2);
		var dimensions_of_grid_2 = [bounds_of_grid_2[1][0] - bounds_of_grid_2[0][0]
		,bounds_of_grid_2[1][1] - bounds_of_grid_2[0][1]];
		
		var difference = dimensions_of_grid_2[0]*dimensions_of_grid_2[1] - dimensions_of_grid_1[0]*dimensions_of_grid_1[1];
		if (difference != 0) {
			return difference;
		} else {
			var values_1 = get_sorted_values_in_grid(grid_1);
			var values_2 = get_sorted_values_in_grid(grid_2);
			while (values_1[values_1.length - 1] == values_2[values_2.length - 1]) {
				values_1.pop();
				values_2.pop();
			}
			return values_2[values_2.length - 1] - values_1[values_1.length - 1];
		}
	});

	

	
	var grids_positions = [];

	var maximum_y = 0;
	
	for (var i = 0; i < grids.length; i++) {
		var grid = grids[i];
		var bounds = get_bounds_of_grid(grid);
		var dimensions_of_grid = [bounds[1][0] - bounds[0][0]
		,bounds[1][1] - bounds[0][1]];
		var lower_bound_for_grid = get_lower_bound_for_grid(grids_positions
							,dimensions_of_grid,width_of_window/(width_of_cell + width_of_border),0.2);
		var upper_bound_for_grid = [lower_bound_for_grid[0] + dimensions_of_grid[0]
									,lower_bound_for_grid[1]+ dimensions_of_grid[1]];
		grids_positions.push([lower_bound_for_grid, upper_bound_for_grid]);

		for_each_index_in_grid(grid, function(grid_index) {
			var uid = get_value_in_grid(grid,grid_index);
			var coordinate = get_coordinate(grid_index);
			
			
			var shifted_coordinate = [coordinate[0] -bounds[0][0] + lower_bound_for_grid[0]
										,coordinate[1] -bounds[0][1] + lower_bound_for_grid[1]];
			
			var expand_edge = [];
			
			var shifts_counter_clockwise = [[-1,0],[0,1],[1,1],[1,0],[0,-1],[-1,-1]];
			
			for (var shift_index = 0; shift_index < shifts_counter_clockwise.length; shift_index++) {
				var index_x = grid_index[0] + shifts_counter_clockwise[shift_index][0];
				var index_y = grid_index[1] + shifts_counter_clockwise[shift_index][1];
				expand_edge.push(get_value_in_grid(grid, [ index_x, index_y]) == undefined);							
			}
			
      var area_element = document.getElementById("area");
			var position = {x:(width_of_cell + width_of_border)*shifted_coordinate[0]
							, y:(width_of_cell + width_of_border)*shifted_coordinate[1]};
			
			draw_contact_icon(area_element,user.friends[uid],position, width_of_cell, expand_edge);
			if (position.y > maximum_y) {
				maximum_y = position.y;
				var height_of_window = maximum_y + width_of_cell;
				area_element.setAttribute("height",height_of_window);
			}
		});
		
		
	}
	VK.callMethod("resizeWindow", 606, maximum_y + width_of_cell + 100);				

	
	
}



function getUrlParameter(url, parameterName) {
	var param_str = "&" + parameterName + "=";
	
	var val_str_begin = url.indexOf(param_str) + param_str.length;

	var val_str_end = url.indexOf("&", val_str_begin);
	return url.substr(val_str_begin, val_str_end - val_str_begin);
}

//autorun on page load
setTimeout( function() {
	
  draw()

	VK.Modules.load('md5', function() {
	}, "//vk.com/js/api/modules/md5.js");
	
  var userId = get_app_user_uid();
	var userContact = {uid:userId};

  setTimeout(function() { check_draw_grid_of_friends(userContact); }, 4500);

	//loaded_contacts[userContact.uid] = userContact;

  VK.api("friends.get", {user_id: userId, fields:"uid,first_name,last_name,photo_100,online"}, function(data) { 
    if (data.error) {
      alert(data.error.error_msg);
    }

    userContact.friends = {};
    for (var uid_index=0;uid_index<data.response.length;uid_index++) {
      userContact.friends[data.response[uid_index].uid]=data.response[uid_index];
    }

		var friends_left_to_process = 0;
		for (var uid in userContact.friends) {
			friends_left_to_process++;
			var friend = {uid:Number(uid)};
			vk_loader.load(friends_getMutual_traits,{contact_1:userContact,contact_2:friend},function(parameters,result_message) {
/*
				if (result_message == "Success" 
					&& parameters.contact_2.mutual_friends 
					&& parameters.contact_2.mutual_friends[parameters.contact_1.uid]){
					loaded_contacts[parameters.contact_2.uid] = parameters.contact_2;
				}
*/
				friends_left_to_process--;
				if (friends_left_to_process == 0) {
					process_output(userContact);									

					
				}				
			});
		}
  });
	

		
	

}, 0);

		
		
function clone_graph_without_node(graph, node_id) {
		var cloned_graph = {};
		for (var connection_node_id in graph) {
			if (connection_node_id != node_id) {
				var connections = [];
				for (var connection_index = 0; connection_index < graph[connection_node_id].connections.length;connection_index++) {
					var connection_id = graph[connection_node_id].connections[connection_index];
					if (connection_id != node_id) {
						connections.push(connection_id);
					}
				}					
				cloned_graph[connection_node_id] = {connections : connections};
			}
		}
		return cloned_graph;
	}
	
	function find_node_with_minimum_connections(graph) {
		var minimum = 0;
		while (true) {
			for (var uid in graph) {
				if (graph[uid].connections.length == minimum) {
					return Number(uid);
				}
			}
			minimum++;
		}
	}
	
	function merge_segments_with_same_uid_at_tip(segments,graph) {
		for (var segment_index_1 = 0; segment_index_1 < segments.length;segment_index_1++) {
			var segment_1 = segments[segment_index_1];

//algorithm may be improved by different handling of segments with same uids on tips
			if (segment_1[0] == segment_1[segment_1.length - 1]) {
				segment_1.pop();
				return {segments_are_changed:true,graph:graph};
			}
			for (var segment_index_2 = 0; segment_index_2 < segments.length;segment_index_2++) {
				if (segment_index_2 != segment_index_1) {
					var segment_2 = segments[segment_index_2];
					if (segment_1[segment_1.length - 1] == segment_2[0]
						|| segment_1[segment_1.length - 1] == segment_2[segment_2.length - 1]) {
						segment_1.reverse();
					}
					if (segment_2[0] == segment_1[0]) {
						segment_2.reverse();
					}
					if (segment_1[0] == segment_2[segment_2.length - 1]) {
						segment_2.pop();
						var new_graph = clone_graph_without_node(graph,segment_1[0]);
						segments[segment_index_1] = segment_2.concat(segment_1);
						segments.splice(segment_index_2,1);
						return {segments_are_changed:true,graph:new_graph};
					}
				}
			}
		}
		return {segments_are_changed:false,graph:graph};
	}
	
	function form_graph_of_uids_connections(edges_counter,uids) {
		var existing_segments = {};
		for (var uid_index = 0;uid_index < uids.length; uid_index++) {
			var uid_1 = uids[uid_index];
			var connections = [];
			for (var uid_2_index = 0; uid_2_index < uids.length;uid_2_index++) {
				var uid_2 = uids[uid_2_index];
				if (uid_1 != uid_2 && edges_counter[[uid_1,uid_2]]) {
					connections.push(uid_2);
				}
			}
			existing_segments[uid_1] = {connections : connections};
		}
		return existing_segments;
	}
	

	
	function find_bounding_indexes(grid) {
		var lower_bound = [Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY]; 
		var upper_bound = [Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY];
		for_each_index_in_grid(grid,function(grid_index) {
			if (lower_bound[0] > grid_index[0]) {
				lower_bound[0] = grid_index[0];
			}
			if (lower_bound[1] > grid_index[1]) {
				lower_bound[1] = grid_index[1];
			}
			if (upper_bound[0] < grid_index[0]) {
				upper_bound[0] = grid_index[0];
			}
			if (upper_bound[1] < grid_index[1]) {
				upper_bound[1] = grid_index[1];
			}			
		});
		return [lower_bound,upper_bound];
	}

	function get_distance(coordinate_1,coordinate_2) {
		var delta = [coordinate_2[0]-coordinate_1[0]
					,coordinate_2[1]-coordinate_1[1]];		
		return Math.sqrt(delta[0]*delta[0] + delta[1]*delta[1]);
	}
	
	function index_fits_grid(grid, index, maximum_width) {
		
		var bounds_of_area = get_bounds_of_area([get_bounds_of_grid(grid)
							                       , get_bounds_of_cell(index)]);
		return !get_value_in_grid(grid,index) 
			&& bounds_of_area[1][0] - bounds_of_area[0][0] < maximum_width;
	}
	
	function get_nearest_free_index(grid,coordinate, maximum_width) {
		
		var index = get_index(coordinate);

		if (index_fits_grid(grid, index, maximum_width)) {
			return index;
		}
		var r = 1;
		var nearest_found_free_index = undefined;
		var current_index = index;
		while (true) {
			current_index = [current_index[0],current_index[1] + 1];
			var nearest_found_index_in_cycle = current_index;

			var shifts = [[1,-1],[0,-1],[-1,0],[-1,1],[0,1],[1,0]];
			for (var shift_index = 0; shift_index < shifts.length;shift_index++) {
				var shift = shifts[shift_index];
				for (var counter = 0; counter < r; counter++) {
					var distance_to_current_index = get_distance(coordinate
							,get_coordinate(current_index));
					var distance_to_nearest_found_index_in_cycle = get_distance(coordinate
														,get_coordinate(nearest_found_index_in_cycle));
					if (distance_to_current_index < distance_to_nearest_found_index_in_cycle) {
							nearest_found_index_in_cycle = current_index;							
						}
					if (index_fits_grid(grid, current_index, maximum_width)) {
						if (nearest_found_free_index) {
							var distance_to_nearest_found_free_index = get_distance(coordinate
															,get_coordinate(nearest_found_free_index));
							
							if (distance_to_current_index < distance_to_nearest_found_free_index) {
								nearest_found_free_index = current_index;
							}
						}
						else {
							nearest_found_free_index = current_index;
						}
					}
					current_index = [current_index[0] + shift[0],current_index[1] + shift[1]];
				}
			}
			if (nearest_found_free_index) {
				var distance_to_nearest_found_free_index = get_distance(coordinate
															,get_coordinate(nearest_found_free_index));
				var distance_to_nearest_found_index_in_cycle = get_distance(coordinate
														,get_coordinate(nearest_found_index_in_cycle));
				if (distance_to_nearest_found_free_index <= distance_to_nearest_found_index_in_cycle) {
					return nearest_found_free_index;																
				}
			}
			r++;
			
		}
	}
	
	function get_middle_coordinate(indexes) {
		if (indexes.length == 0) {
			return [0,0];
		}
		var accumulator = [0,0];
		for (var index_of_index = 0; index_of_index < indexes.length; index_of_index++) {
			var index = indexes[index_of_index];
			var coordinate = get_coordinate(index);
			accumulator[0]+=coordinate[0];
			accumulator[1]+=coordinate[1];			
		}
		
		var middle_coordinate = [accumulator[0]/indexes.length
		                    ,accumulator[1]/indexes.length];
		
		return middle_coordinate;
	}
	
	function get_coordinate(index) {
		var k1 = Math.sqrt(3)/2;
		var k2 = Math.sqrt(3) - 3/2;
		
		var x_offset = (-index[1]*k2 + index[0]*k1);
		var y_offset = (index[1]*k1 - index[0]*k2);
		
		return [x_offset,y_offset];
	}

	function get_index(coordinate) {
		var divisor = 3*Math.sqrt(3) - 18/4;
		
		var k1 = Math.sqrt(3)/2;
		var k2 = Math.sqrt(3) - 3/2;
		
		
		return [Math.round((k1*coordinate[0] + k2*coordinate[1])/divisor)
				,Math.round((k1*coordinate[1] + k2*coordinate[0])/divisor)];
	}

	
	function scale_vector(vector, new_length) {
		var arg = new_length/Math.sqrt(vector[0]*vector[0] + vector[1]*vector[1]);
		var sx = vector[0]*arg;
		var sy = vector[1]*arg;
		return [sx, sy];		
	}

	function calculate_vector(angle, length) {
		return [Math.cos(angle)*length,Math.sin(angle)*length];
	}
	
	
	function calculate_radius(angle, delta) {
		var length = Math.sqrt(delta[0]*delta[0] + delta[1]*delta[1]);
		switch (angle)
		{
		case 120:
			return length;
		case 150:
			return length/Math.sqrt(2 - Math.sqrt(3));
		default:
			throw "not supported angle";
		}		
	}
	
	function get_path_of_contact_icon(points) {
		var path = "M " + points[0][0] + " " + points[0][1];
		for (var point_index = 1; point_index < points.length; point_index++) {
			path += "L " + points[point_index][0] + " " + points[point_index][1];
		}
		path +=" z";
		return path;
	}
	
	function get_sum_of_vectors(vector_1,vector_2) {
		var sum = [];
		for (var index = 0; index < vector_1.length;index++) {
			sum.push(vector_1[index] + vector_2[index]);
		}
		return sum;
	}
	
	function continue_shape(points,offset) {
		var next_point = get_sum_of_vectors(points[points.length - 1],offset);
		points.push(next_point);
	}
	
	function get_lower_bound_of_shape(points) {
		var lower_bound = [points[0][0],points[0][1]];
		for (var i = 1; i < points.length; i++) {
			if (lower_bound[0] > points[i][0]) {
				lower_bound[0] = points[i][0];
			}
			if (lower_bound[1] > points[i][1]) {
				lower_bound[1] = points[i][1];
			}			
		}
		return lower_bound;
	}
	
//Function return points with coordinates shifted to the rounded lower bound and then rounded. 	
	function get_aligned_shape(points) {
		var lower_bound = get_lower_bound_of_shape(points);
		var lower_bound_of_aligned_shape = [Math.round(lower_bound[0]),Math.round(lower_bound[1])];
		var shift = [lower_bound_of_aligned_shape[0] - lower_bound[0], lower_bound_of_aligned_shape[1] - lower_bound[1]];
		var aligned_shape = [];
		for (var index = 0; index < points.length; index++) {
			var point = points[index];
			var shifted_point = [point[0] + shift[0], point[1] + shift[1]];
			var aligned_point = [Math.round(shifted_point[0]),Math.round(shifted_point[1])];
			aligned_shape.push(aligned_point);
		}
		return aligned_shape;		
	}
		
	
	function get_shape_of_object(start_point, deltas, invert_axis_of_object, expand_edge, width_of_cell) {
		var points = [start_point];
		var angle = 0;
		for (var point_index = 0; point_index < deltas.length; point_index++) {
			var previous_index = (deltas.length+point_index - 1)%deltas.length;
			var next_index = (point_index + 1)%deltas.length;
			var previous_delta = deltas[previous_index];			
			var delta = deltas[point_index];
			
			var distance_from_corner = 0;
			var previous_scaled_delta = scale_vector(previous_delta, distance_from_corner);
			var scaled_delta = scale_vector(delta, distance_from_corner);
			var index_of_x_axis = invert_axis_of_object ? 1 : 0;
			var index_of_y_axis = invert_axis_of_object ? 0 : 1;
			
			
// handling of lower left corner			
			if (expand_edge[0] && expand_edge[1] && point_index == 1) {
				var line_width = previous_delta[0] + delta[0];
				var line_height = previous_delta[1] + delta[1];
				continue_shape(points,[0,line_height]);
				continue_shape(points,[line_width,0]);
			}
			if (expand_edge[0] && expand_edge[1] && (point_index == 0 || point_index == 1)) {
				continue;
			}

			//handling of upper right corner			
			if (expand_edge[3] && expand_edge[4] && point_index == 4) {
				var line_width = previous_delta[0] + delta[0];
				var line_height = previous_delta[1] + delta[1];
				continue_shape(points,[0,line_height]);
				continue_shape(points,[line_width,0]);
			}
			if (expand_edge[3] && expand_edge[4] && (point_index == 3 || point_index == 4)) {
				continue;
			}
			
/*			
			if (!expand_edge[previous_index] || !expand_edge[point_index]) {
				var ellipse_destination = [0, 0];
				if (!expand_edge[previous_index]) {
					ellipse_destination[0] += previous_scaled_delta[index_of_x_axis];
					ellipse_destination[1] += previous_scaled_delta[index_of_y_axis];
				}
				if (!expand_edge[point_index]) {
					ellipse_destination[0] += scaled_delta[index_of_x_axis];
					ellipse_destination[1] += scaled_delta[index_of_y_axis];
				}
				var radius = calculate_radius(delta[2], ellipse_destination); 
				
				var angle = 0;

				path += " a " + radius + "," + radius
				+ " " + angle + " 0," + (invert_axis_of_object ? 0 : 1) + " "
					+ ellipse_destination[0] + "," + ellipse_destination[1];								
			}
*/			

			

			if (expand_edge[point_index]) {
				var line_width = delta[index_of_x_axis];
				var line_height = delta[index_of_y_axis];
				if (point_index == 2 || point_index == 5) {
					continue_shape(points,[line_width,0]);
					continue_shape(points,[0,line_height]);
				}
				else {
					continue_shape(points,[0,line_height]);
					continue_shape(points,[line_width,0]);
				}
			} else {							
				var line_width = delta[index_of_x_axis] - 2*scaled_delta[index_of_x_axis];
				var line_height = delta[index_of_y_axis] - 2*scaled_delta[index_of_y_axis]; 
				continue_shape(points,[line_width,line_height]);
			}

		}
		return points;
		
	}
	
	function calculate_deltas_of_hexagon(length_of_side,angle_of_rotation) {
		var deltas = [];
		for (var side_index = 0;side_index <6; side_index++) {
			var angle = ( angle_of_rotation + side_index*Math.PI/3 );
			var delta = calculate_vector(angle,length_of_side);
			delta.push(120);
			deltas.push(delta);
		}
		return deltas;
	}
	
	function get_bounds_of_cell(index) {
		var offset = 1/2;
		var coordinate = get_coordinate(index);
		return [[coordinate[0]-offset,coordinate[1]-offset]
		 	   ,[coordinate[0]+offset,coordinate[1]+offset]];		
	}
	
	function get_bounds_of_grid(grid) {
		
		var bounds = [[Number.POSITIVE_INFINITY,Number.POSITIVE_INFINITY]
						,[Number.NEGATIVE_INFINITY,Number.NEGATIVE_INFINITY]];
		
		
		for_each_index_in_grid(grid, function(index) {
			var bounds_of_cell = get_bounds_of_cell(index);
			
			if (bounds_of_cell[0][0] < bounds[0][0]) {
				bounds[0][0] = bounds_of_cell[0][0];
			}
			if (bounds_of_cell[0][1] < bounds[0][1]) {
				bounds[0][1] = bounds_of_cell[0][1];
			}
			if (bounds_of_cell[1][0] > bounds[1][0]) {
				bounds[1][0] = bounds_of_cell[1][0];
			}
			if (bounds_of_cell[1][1] > bounds[1][1]) {
				bounds[1][1] = bounds_of_cell[1][1];
			}			
		});
		return bounds;
	}
	
	function create_contact_icon(area_element,contact,width_of_cell,offset, expand_edge) {

		if (contact && contact.photo_100) {
			
			var sqrt3 = Math.sqrt(3);

			
			var deltas = calculate_deltas_of_hexagon(width_of_cell/Math.sqrt(2 + Math.sqrt(3)),Math.PI/12);
			

			
			var shape = get_shape_of_object([offset.x + deltas[3][0]
													,offset.y + deltas[3][1]], deltas, true, expand_edge, width_of_cell);
			var aligned_shape = get_aligned_shape(shape);
			var path_string = get_path_of_contact_icon(aligned_shape);

			
			var coordinates = ""
				for (var point_index = 0; point_index < aligned_shape.length; point_index++) {
					coordinates += aligned_shape[point_index][0] + " " + aligned_shape[point_index][1] + " ";
				}
			coordinates += aligned_shape[0][0] + " " + aligned_shape[0][1];
			

			var polygon_element = document.createElementNS("http://www.w3.org/2000/svg","polygon");
			polygon_element.setAttribute("points",coordinates);

			var lower_bound_of_image = get_lower_bound_of_shape(aligned_shape);
			
			var clip_path_element = document.createElementNS("http://www.w3.org/2000/svg","clipPath");
			var clipPathId = "clipPathForUID" + contact.uid;
			clip_path_element.setAttribute("id",clipPathId);
			
			clip_path_element.appendChild(polygon_element);
			var defs_element = area_element.getElementsByTagName("defs")[0];
			defs_element.appendChild(clip_path_element);
			
						
			var image_element = document.createElementNS("http://www.w3.org/2000/svg","image");
			image_element.setAttribute("x",lower_bound_of_image[0]);
			image_element.setAttribute("y",lower_bound_of_image[1]);
			image_element.setAttribute("width",width_of_cell);
			image_element.setAttribute("height",width_of_cell);
			image_element.setAttribute("cursor","pointer");
			var image_title = contact.first_name + " " + contact.last_name;
			image_element.setAttributeNS("http://www.w3.org/1999/xlink","href",contact.photo_100);
			image_element.setAttribute("clip-path", "url(#" + clipPathId + ")");

			var anchor_element = document.createElementNS("http://www.w3.org/2000/svg","a");
			anchor_element.setAttributeNS("http://www.w3.org/1999/xlink","href",get_contact_url(contact.uid));
			anchor_element.setAttributeNS("http://www.w3.org/1999/xlink","show","replace");
			anchor_element.setAttribute("target","_top");
			anchor_element.setAttributeNS("http://www.w3.org/1999/xlink","title",image_title);
			
			anchor_element.appendChild(image_element)
			
			area_element.appendChild(anchor_element);

      var status_index = 0;
      var status_position_y = 0;
      for (var i = 0; i < aligned_shape.length; i++) {
        if (aligned_shape[i][1] >= status_position_y) {
          status_index = i;
          status_position_y = aligned_shape[i][1];
        }
      }
        


      if (contact.online == 1) {
        var dx = status_index > 0 && aligned_shape[status_index][1] == aligned_shape[status_index - 1][1] ? 7 : 1.5;
        var status_image_element = document.createElementNS("http://www.w3.org/2000/svg","circle");
        status_image_element.setAttribute("cx",aligned_shape[status_index][0] - dx);
        status_image_element.setAttribute("cy",aligned_shape[status_index][1] - 7);
        status_image_element.setAttribute("r","5");
        status_image_element.setAttribute("stroke","white");
        status_image_element.setAttribute("stroke-width",2);
        status_image_element.setAttribute("fill","#86a2c4");

        area_element.appendChild(status_image_element);
      }



			return image_element;
		}
		else {
//TODO implement
//			var color = window.Raphael.getColor();
//			return paper.ellipse(offset.x, offset.y, 20, 15)
//				.attr({fill: color, stroke: color, "stroke-width": 2,"cursor" : "pointer"});
		}
		
	}
	
	function draw_contact_icon(area_element,contact,position,width_of_cell, expand_edge) {
		
		var icon = create_contact_icon(area_element,contact,width_of_cell, position, expand_edge);
	
	}
		
	

